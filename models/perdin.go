package models

import "time"

type PerdinRequest struct {
	ID uint `gorm:"primaryKey"`

	// Relasi ManyToOne ke User
	UserID uint `gorm:"not null"`
	User   User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	Purpose   string    `gorm:"type:varchar(500);not null"`
	StartDate time.Time `gorm:"type:date;not null"`
	EndDate   time.Time `gorm:"type:date;not null"`

	// Relasi ManyToOne ke Kota Asal
	OriginCityID uint `gorm:"not null"`
	OriginCity   City `gorm:"foreignKey:OriginCityID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	// Relasi ManyToOne ke Kota Tujuan
	DestinationCityID uint `gorm:"not null"`
	DestinationCity   City `gorm:"foreignKey:DestinationCityID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

	Duration         int       `gorm:"not null"`
	Status           string    `gorm:"not null;default:'PENDING'"`
	TanggalPengajuan time.Time `gorm:"type:date;not null"`

	DailyAllowance *float64 `gorm:"type:decimal(15,2)"`
	Currency       *string  `gorm:"type:varchar(3)"`
	TotalAllowance *float64 `gorm:"type:decimal(15,2)"`
}
