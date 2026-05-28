package models

// City merepresentasikan tabel cities
type City struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	Name      string  `gorm:"not null" json:"name"`
	Latitude  float64 `gorm:"not null" json:"latitude"`
	Longitude float64 `gorm:"not null" json:"longitude"`
	Province  string  `gorm:"not null" json:"province"`
	Island    string  `gorm:"not null" json:"island"`
	IsForeign bool    `gorm:"not null" json:"isForeign"`
}
