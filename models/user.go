package models

// User merepresentasikan tabel users di database
type User struct {
	ID             uint   `gorm:"primaryKey"`
	Username       string `gorm:"unique;not null"`
	Password       string `gorm:"not null" json:"-"`
	Role           string `gorm:"not null"`
	SessionVersion uint   `gorm:"not null;default:0" json:"-"`
}
