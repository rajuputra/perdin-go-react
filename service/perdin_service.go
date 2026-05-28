package service

import (
	"errors"
	"perdin-go/dto"
	"perdin-go/models"
	"perdin-go/repository"
	"time"
)

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
		StartDate:           p.StartDate.Format("2006-01-02"), // Format ke YYYY-MM-DD string
		EndDate:             p.EndDate.Format("2006-01-02"),
		OriginCityName:      p.OriginCity.Name,
		DestinationCityName: p.DestinationCity.Name,
		Duration:            p.Duration,
		Status:              p.Status,
		TanggalPengajuan:    p.TanggalPengajuan.Format("2006-01-02T15:04:05Z"),
		DailyAllowance:      p.DailyAllowance,
		Currency:            p.Currency,
		TotalAllowance:      p.TotalAllowance,
		Distance:            nil, // Default nil, diisi hanya saat get detail
	}
}

// Struct penampung hitungan (mirip Record AllowanceCalculation di Java)
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
	user, err := s.userRepo.FindById(userId)
	if err != nil {
		return dto.PerdinResponse{}, errors.New("user tidak ditemukan")
	}

	origin, err := s.cityRepo.FindById(req.OriginCityID)
	if err != nil {
		return dto.PerdinResponse{}, errors.New("kota asal tidak ditemukan")
	}

	dest, err := s.cityRepo.FindById(req.DestinationCityID)
	if err != nil {
		return dto.PerdinResponse{}, errors.New("kota tujuan tidak ditemukan")
	}

	duration := s.allowanceServ.CalculateDuration(req.StartDate, req.EndDate)

	perdin := models.PerdinRequest{
		UserID:            user.ID,
		User:              user,
		Purpose:           req.Purpose,
		StartDate:         req.StartDate,
		EndDate:           req.EndDate,
		OriginCityID:      origin.ID,
		OriginCity:        origin,
		DestinationCityID: dest.ID,
		DestinationCity:   dest,
		Duration:          duration,
		Status:            "PENDING",
		TanggalPengajuan:  time.Now(),
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
		return dto.PerdinResponse{}, errors.New("data perdin tidak ditemukan")
	}

	response := mapToResponse(perdin)
	calc := s.performCalculations(perdin)

	// Masukkan jarak tempuh
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
		return dto.PerdinResponse{}, errors.New("data perdin tidak ditemukan")
	}

	if perdin.Status != "PENDING" {
		return dto.PerdinResponse{}, errors.New("hanya pengajuan PENDING yang dapat disetujui")
	}

	calc := s.performCalculations(perdin)

	// Update data di entitas lalu simpan ke DB
	perdin.Status = "APPROVED"
	perdin.DailyAllowance = &calc.Daily
	perdin.TotalAllowance = &calc.Total
	perdin.Currency = &calc.Currency

	savedPerdin, err := s.perdinRepo.Save(perdin)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	res := mapToResponse(savedPerdin)
	dist := calc.Distance
	res.Distance = &dist
	return res, nil
}

func (s *perdinService) RejectPerdin(perdinId uint) (dto.PerdinResponse, error) {
	perdin, err := s.perdinRepo.FindById(perdinId)
	if err != nil {
		return dto.PerdinResponse{}, errors.New("data perdin tidak ditemukan")
	}

	if perdin.Status != "PENDING" {
		return dto.PerdinResponse{}, errors.New("hanya pengajuan PENDING yang dapat ditolak")
	}

	perdin.Status = "REJECTED"
	savedPerdin, err := s.perdinRepo.Save(perdin)
	if err != nil {
		return dto.PerdinResponse{}, err
	}

	return mapToResponse(savedPerdin), nil
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
