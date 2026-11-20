package models

import "time"

type Session struct {
	ID        string    `gorm:"primaryKey;size:64"`
	UserID    uint      `gorm:"not null;index"`
	User      User      `gorm:"constraint:OnDelete:CASCADE"`
	Version   uint      `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null;index"`
}
