package repository

import (
	"errors"
	"perdin-go/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrAdminRequired = errors.New("perubahan memerlukan administrator aktif dan minimal satu admin")

// Interface (Kontrak)
type UserRepository interface {
	FindByUsername(username string) (models.User, error)
	BootstrapAdmin(user models.User) error
	UpdateAccess(actorID, userID uint, role, passwordHash string) error
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

func (r *userRepository) Save(user models.User) (models.User, error) {
	err := r.db.Create(&user).Error
	return user, err
}

func (r *userRepository) BootstrapAdmin(user models.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("SELECT pg_advisory_xact_lock(41907001)").Error; err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&models.User{}).Where("role = ?", "ADMIN").Count(&count).Error; err != nil {
			return err
		}
		if count != 0 {
			return errors.New("administrator sudah tersedia")
		}
		return tx.Create(&user).Error
	})
}

func (r *userRepository) UpdateAccess(actorID, userID uint, role, passwordHash string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("SELECT pg_advisory_xact_lock(41907001)").Error; err != nil {
			return err
		}
		var actor models.User
		if err := tx.First(&actor, actorID).Error; err != nil {
			return err
		}
		if actor.Role != "ADMIN" {
			return ErrAdminRequired
		}
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return err
		}
		if user.Role == "ADMIN" && role != "ADMIN" {
			var count int64
			if err := tx.Model(&models.User{}).Where("role = ?", "ADMIN").Count(&count).Error; err != nil {
				return err
			}
			if count < 2 {
				return ErrAdminRequired
			}
		}
		if user.Role == role && passwordHash == "" {
			return nil
		}
		values := map[string]any{"role": role, "session_version": gorm.Expr("session_version + 1")}
		if passwordHash != "" {
			values["password"] = passwordHash
		}
		return tx.Model(&user).Updates(values).Error
	})
}

func (r *userRepository) FindById(id uint) (models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	return user, err
}
