package service

import (
	"errors"
	"perdin-go/dto"
	"perdin-go/models"
	"perdin-go/repository"
	"strings"
	"time"

	"gorm.io/gorm"
)

var ErrInvalidSubmission = errors.New("tujuan, kota atau tanggal perjalanan tidak valid")
var ErrCityNotFound = errors.New("kota asal atau tujuan tidak ditemukan")

var jakarta = time.FixedZone("WIB", 7*60*60)

type PerdinService interface {
	SubmitPerdin(userId uint, req dto.PerdinSubmissionRequest) (dto.PerdinResponse, error)
	GetPerdinHistoryByUser(userId uint) ([]dto.PerdinResponse, error)
	GetAllPerdinByStatus(status string) ([]dto.PerdinResponse, error)
	GetAllPerdin() ([]dto.PerdinResponse, error)
	GetPerdinDetailWithCalculation(perdinId uint) (dto.PerdinResponse, error)
	ApprovePerdin(perdinId uint) (dto.PerdinResponse, error)
	RejectPerdin(perdinId uint) (dto.PerdinResponse, error)
}

type perdinService struct {
	perdinRepo    repository.PerdinRepository
	userRepo      repository.UserRepository
	cityRepo      repository.CityRepository
	allowanceServ AllowanceService
}

func NewPerdinService(pr repository.PerdinRepository, ur repository.UserRepository, cr repository.CityRepository, as AllowanceService) PerdinService {
	return &perdinService{pr, ur, cr, as}
}

// Helper untuk Mapping Model ke DTO
func mapToResponse(p models.PerdinRequest) dto.PerdinResponse {
	return dto.PerdinResponse{
		ID:                  p.ID,
		Username:            p.User.Username,
		Purpose:             p.Purpose,
		StartDate:           p.StartDate.Format("2006-01-02"),
		EndDate:             p.EndDate.Format("2006-01-02"),
		OriginCityName:      p.OriginCity.Name,
		DestinationCityName: p.DestinationCity.Name,
		Duration:            p.Duration,
		Status:              p.Status,
		TanggalPengajuan:    p.TanggalPengajuan.Format(time.DateOnly),
		DailyAllowance:      p.DailyAllowance,
		Currency:            p.Currency,
		TotalAllowance:      p.TotalAllowance,
		Distance:            nil,
	}
}

// Struct penampung hitungan
type allowanceCalc struct {
	Distance float64
	Daily    float64
	Currency string
	Total    float64
}

func (s *perdinService) performCalculations(p models.PerdinRequest) allowanceCalc {
	distance := s.allowanceServ.CalculateDistance(p.OriginCity.Latitude, p.OriginCity.Longitude, p.DestinationCity.Latitude, p.DestinationCity.Longitude)
	daily := s.allowanceServ.CalculateDailyAllowance(p.OriginCity, p.DestinationCity, distance)
	curr := s.allowanceServ.DetermineCurrency(p.DestinationCity)
	total := s.allowanceServ.CalculateTotalAllowance(p.Duration, daily)

	return allowanceCalc{Distance: distance, Daily: daily, Currency: curr, Total: total}
}

func (s *perdinService) SubmitPerdin(userId uint, req dto.PerdinSubmissionRequest) (dto.PerdinResponse, error) {
	now := time.Now().In(jakarta)
	start, startErr := time.Parse(time.DateOnly, req.StartDate)
	end, endErr := time.Parse(time.DateOnly, req.EndDate)
	purpose := strings.TrimSpace(req.Purpose)
	if startErr != nil || endErr != nil || req.StartDate < now.Format(time.DateOnly) ||
		end.Before(start) || req.OriginCityID == req.DestinationCityID || purpose == "" {
		return dto.PerdinResponse{}, ErrInvalidSubmission
	}
	user, err := s.userRepo.FindById(userId)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	origin, err := s.cityRepo.FindById(req.OriginCityID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.PerdinResponse{}, ErrCityNotFound
	}
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	dest, err := s.cityRepo.FindById(req.DestinationCityID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.PerdinResponse{}, ErrCityNotFound
	}
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	duration := s.allowanceServ.CalculateDuration(start, end)

	perdin := models.PerdinRequest{
		UserID:            user.ID,
		User:              user,
		Purpose:           purpose,
		StartDate:         start,
		EndDate:           end,
		OriginCityID:      origin.ID,
		OriginCity:        origin,
		DestinationCityID: dest.ID,
		DestinationCity:   dest,
		Duration:          duration,
		Status:            "PENDING",
		TanggalPengajuan:  now,
	}

	savedPerdin, err := s.perdinRepo.Save(perdin)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	return mapToResponse(savedPerdin), nil
}

func (s *perdinService) GetPerdinDetailWithCalculation(perdinId uint) (dto.PerdinResponse, error) {
	perdin, err := s.perdinRepo.FindById(perdinId)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	response := mapToResponse(perdin)
	calc := s.performCalculations(perdin)

	// jarak tempuh
	distance := calc.Distance
	response.Distance = &distance

	// Jika status PENDING, proyeksikan uang saku ke Response DTO tanpa menyimpannya ke DB
	if perdin.Status == "PENDING" {
		daily := calc.Daily
		total := calc.Total
		curr := calc.Currency

		response.DailyAllowance = &daily
		response.TotalAllowance = &total
		response.Currency = &curr
	}

	return response, nil
}

func (s *perdinService) ApprovePerdin(perdinId uint) (dto.PerdinResponse, error) {
	perdin, err := s.perdinRepo.FindById(perdinId)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	if perdin.Status != "PENDING" {
		return dto.PerdinResponse{}, repository.ErrDecisionConflict
	}

	calc := s.performCalculations(perdin)

	// Update data di entitas lalu simpan ke DB
	perdin.Status = "APPROVED"
	perdin.DailyAllowance = &calc.Daily
	perdin.TotalAllowance = &calc.Total
	perdin.Currency = &calc.Currency

	if err := s.perdinRepo.Decide(perdin); err != nil {
		return dto.PerdinResponse{}, err
	}

	res := mapToResponse(perdin)
	dist := calc.Distance
	res.Distance = &dist
	return res, nil
}

func (s *perdinService) RejectPerdin(perdinId uint) (dto.PerdinResponse, error) {
	perdin, err := s.perdinRepo.FindById(perdinId)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	if perdin.Status != "PENDING" {
		return dto.PerdinResponse{}, repository.ErrDecisionConflict
	}

	perdin.Status = "REJECTED"
	if err := s.perdinRepo.Decide(perdin); err != nil {
		return dto.PerdinResponse{}, err
	}

	return mapToResponse(perdin), nil
}

// Method Getter List
func (s *perdinService) GetPerdinHistoryByUser(userId uint) ([]dto.PerdinResponse, error) {
	perdins, err := s.perdinRepo.FindByUserId(userId)
	if err != nil {
		return nil, err
	}
	res := []dto.PerdinResponse{}
	for _, p := range perdins {
		res = append(res, mapToResponse(p))
	}
	return res, nil
}

func (s *perdinService) GetAllPerdinByStatus(status string) ([]dto.PerdinResponse, error) {
	perdins, err := s.perdinRepo.FindByStatus(status)
	if err != nil {
		return nil, err
	}
	res := []dto.PerdinResponse{}
	for _, p := range perdins {
		res = append(res, mapToResponse(p))
	}
	return res, nil
}

func (s *perdinService) GetAllPerdin() ([]dto.PerdinResponse, error) {
	perdins, err := s.perdinRepo.FindAll()
	if err != nil {
		return nil, err
	}
	res := []dto.PerdinResponse{}
	for _, p := range perdins {
		res = append(res, mapToResponse(p))
	}
	return res, nil
}
