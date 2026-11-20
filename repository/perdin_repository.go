package repository

import (
	"errors"
	"perdin-go/models"

	"gorm.io/gorm"
)

var ErrDecisionConflict = errors.New("pengajuan sudah diproses")

type PerdinRepository interface {
	Save(perdin models.PerdinRequest) (models.PerdinRequest, error)
	Decide(perdin models.PerdinRequest) error
	FindById(id uint) (models.PerdinRequest, error)
	FindByUserId(userId uint) ([]models.PerdinRequest, error)
	FindByStatus(status string) ([]models.PerdinRequest, error)
	FindAll() ([]models.PerdinRequest, error)
}

type perdinRepository struct {
	db *gorm.DB
}

func NewPerdinRepository(db *gorm.DB) PerdinRepository {
	return &perdinRepository{db}
}

func (r *perdinRepository) Save(perdin models.PerdinRequest) (models.PerdinRequest, error) {
	err := r.db.Omit("User", "OriginCity", "DestinationCity").Create(&perdin).Error
	return perdin, err
}

func (r *perdinRepository) Decide(perdin models.PerdinRequest) error {
	result := r.db.Model(&models.PerdinRequest{}).Where("id = ? AND status = ?", perdin.ID, "PENDING").
		Updates(map[string]any{
			"status": perdin.Status, "daily_allowance": perdin.DailyAllowance,
			"total_allowance": perdin.TotalAllowance, "currency": perdin.Currency,
		})
	if result.Error == nil && result.RowsAffected == 0 {
		return ErrDecisionConflict
	}
	return result.Error
}

func (r *perdinRepository) FindById(id uint) (models.PerdinRequest, error) {
	var perdin models.PerdinRequest

	err := r.db.Preload("User").Preload("OriginCity").Preload("DestinationCity").First(&perdin, id).Error
	return perdin, err
}

func (r *perdinRepository) FindByUserId(userId uint) ([]models.PerdinRequest, error) {
	var perdins []models.PerdinRequest
	err := r.db.Preload("User").Preload("OriginCity").Preload("DestinationCity").
		Where("user_id = ?", userId).
		Order("start_date desc").
		Find(&perdins).Error
	return perdins, err
}

func (r *perdinRepository) FindByStatus(status string) ([]models.PerdinRequest, error) {
	var perdins []models.PerdinRequest
	err := r.db.Preload("User").Preload("OriginCity").Preload("DestinationCity").
		Where("status = ?", status).
		Order("start_date desc").
		Find(&perdins).Error
	return perdins, err
}

func (r *perdinRepository) FindAll() ([]models.PerdinRequest, error) {
	var perdins []models.PerdinRequest
	err := r.db.Preload("User").Preload("OriginCity").Preload("DestinationCity").
		Order("start_date desc").
		Order("status asc").
		Find(&perdins).Error
	return perdins, err
}
