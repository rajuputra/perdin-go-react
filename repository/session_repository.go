package repository

import (
	"time"

	"perdin-go/models"

	"gorm.io/gorm"
)

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(session models.Session) error {
	if err := r.db.Where("expires_at <= ?", time.Now()).Delete(&models.Session{}).Error; err != nil {
		return err
	}
	return r.db.Create(&session).Error
}

func (r *SessionRepository) User(id string, userID uint) (models.User, error) {
	var user models.User
	err := r.db.Model(&models.User{}).
		Joins("JOIN sessions ON sessions.user_id = users.id AND sessions.version = users.session_version").
		Where("sessions.id = ? AND sessions.expires_at > ? AND users.id = ?", id, time.Now(), userID).
		First(&user).Error
	return user, err
}

func (r *SessionRepository) Delete(id string) error {
	return r.db.Delete(&models.Session{}, "id = ?", id).Error
}
