package repository

import (
	"perdin-go/models"

	"gorm.io/gorm"
)

type CityRepository interface {
	FindAll() ([]models.City, error)
	FindById(id uint) (models.City, error)
	Save(city models.City) (models.City, error)
	DeleteById(id uint) error
	ExistsById(id uint) bool
}

type cityRepository struct {
	db *gorm.DB
}

func NewCityRepository(db *gorm.DB) CityRepository {
	return &cityRepository{db}
}

func (r *cityRepository) FindAll() ([]models.City, error) {
	var cities []models.City
	err := r.db.Find(&cities).Error
	return cities, err
}

func (r *cityRepository) FindById(id uint) (models.City, error) {
	var city models.City
	err := r.db.First(&city, id).Error
	return city, err
}

func (r *cityRepository) Save(city models.City) (models.City, error) {
	err := r.db.Save(&city).Error
	return city, err
}

func (r *cityRepository) DeleteById(id uint) error {
	return r.db.Delete(&models.City{}, id).Error
}

func (r *cityRepository) ExistsById(id uint) bool {
	var count int64
	r.db.Model(&models.City{}).Where("id = ?", id).Count(&count)
	return count > 0
}
