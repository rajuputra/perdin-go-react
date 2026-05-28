package repository

import (
	"perdin-go/models"

	"gorm.io/gorm"
)

type PerdinRepository interface {
	Save(perdin models.PerdinRequest) (models.PerdinRequest, error)
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
	err := r.db.Save(&perdin).Error
	return perdin, err
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
