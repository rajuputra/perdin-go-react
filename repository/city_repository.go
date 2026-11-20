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
	Update(city models.City) error
}

type cityRepository struct {
	db *gorm.DB
}

func NewCityRepository(db *gorm.DB) CityRepository {
	return &cityRepository{db}
}

func (r *cityRepository) FindAll() ([]models.City, error) {
	cities := []models.City{}
	err := r.db.Find(&cities).Error
	return cities, err
}

func (r *cityRepository) FindById(id uint) (models.City, error) {
	var city models.City
	err := r.db.First(&city, id).Error
	return city, err
}

func (r *cityRepository) Save(city models.City) (models.City, error) {
	err := r.db.Create(&city).Error
	return city, err
}

func (r *cityRepository) DeleteById(id uint) error {
	return requireAffectedRow(r.db.Delete(&models.City{}, id))
}

func (r *cityRepository) Update(city models.City) error {
	return requireAffectedRow(r.db.Model(&models.City{}).Where("id = ?", city.ID).
		Select("name", "latitude", "longitude", "province", "island", "is_foreign").Updates(city))
}

func requireAffectedRow(result *gorm.DB) error {
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
