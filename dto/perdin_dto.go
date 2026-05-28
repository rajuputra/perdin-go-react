package dto

import "time"

type PerdinSubmissionRequest struct {
	Purpose string `json:"purpose" binding:"required"`
	// time_format sangat penting agar Go tahu format tanggal dari JSON frontend (YYYY-MM-DD)
	StartDate         time.Time `json:"startDate" binding:"required" time_format:"2006-01-02"`
	EndDate           time.Time `json:"endDate" binding:"required" time_format:"2006-01-02"`
	OriginCityID      uint      `json:"originCityId" binding:"required"`
	DestinationCityID uint      `json:"destinationCityId" binding:"required"`
}

type PerdinResponse struct {
	ID                  uint     `json:"id"`
	Username            string   `json:"username"`
	Purpose             string   `json:"purpose"`
	StartDate           string   `json:"startDate"`
	EndDate             string   `json:"endDate"`
	OriginCityName      string   `json:"originCityName"`
	DestinationCityName string   `json:"destinationCityName"`
	Duration            int      `json:"duration"`
	Status              string   `json:"status"`
	TanggalPengajuan    string   `json:"tanggalPengajuan"` // format ISO date string
	DailyAllowance      *float64 `json:"dailyAllowance"`
	Currency            *string  `json:"currency"`
	TotalAllowance      *float64 `json:"totalAllowance"`
	Distance            *float64 `json:"distance"`
}
