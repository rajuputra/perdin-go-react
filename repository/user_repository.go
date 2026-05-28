package repository

import (
	"errors"
	"perdin-go/models"

	"gorm.io/gorm"
)

// Interface (Kontrak)
type UserRepository interface {
	FindByUsername(username string) (models.User, error)
	ExistsByUsername(username string) bool
	Save(user models.User) (models.User, error)
	FindById(id uint) (models.User, error)
	FindAll() ([]models.User, error)
}

func (r *userRepository) FindAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Find(&users).Error
	return users, err
}

// struct implementasi
type userRepository struct {
	db *gorm.DB
}

// Constructor
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

// Implementasi Method
func (r *userRepository) FindByUsername(username string) (models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	return user, err
}

func (r *userRepository) ExistsByUsername(username string) bool {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	return !errors.Is(err, gorm.ErrRecordNotFound) // Return true jika ketemu
}

func (r *userRepository) Save(user models.User) (models.User, error) {
	err := r.db.Save(&user).Error
	return user, err
}

func (r *userRepository) FindById(id uint) (models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	return user, err
}
