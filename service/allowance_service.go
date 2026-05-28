package service

import (
	"math"
	"perdin-go/models"
	"time"
)

type AllowanceService interface {
	CalculateDistance(lat1, lon1, lat2, lon2 float64) float64
	CalculateDuration(startDate, endDate time.Time) int
	CalculateDailyAllowance(origin models.City, destination models.City, distanceKm float64) float64
	DetermineCurrency(destination models.City) string
	CalculateTotalAllowance(duration int, dailyAllowance float64) float64
}

type allowanceService struct{}

func NewAllowanceService() AllowanceService {
	return &allowanceService{}
}

// Helper pengubah derajat ke radian
func toRadians(deg float64) float64 {
	return deg * (math.Pi / 180.0)
}

func (s *allowanceService) CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	dLat := toRadians(lat2 - lat1)
	dLon := toRadians(lon2 - lon1)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRadians(lat1))*math.Cos(toRadians(lat2))*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

func (s *allowanceService) CalculateDuration(startDate, endDate time.Time) int {
	// Menghitung selisih hari. Ditambah 1 karena hari H dihitung penuh.
	days := int(endDate.Sub(startDate).Hours() / 24)
	return days + 1
}

func (s *allowanceService) CalculateDailyAllowance(origin models.City, destination models.City, distanceKm float64) float64 {
	// 1. Luar Negeri (USD 50)
	if destination.IsForeign {
		return 50.00
	}
	// 2. Jarak <= 60km (Rp 0)
	if distanceKm <= 60.0 {
		return 0.0
	}
	// 3. Satu Provinsi (Rp 200.000)
	if origin.Province == destination.Province {
		return 200000.00
	}
	// 4. Beda Provinsi, Satu Pulau (Rp 250.000)
	if origin.Island == destination.Island {
		return 250000.00
	}
	// 5. Beda Provinsi, Beda Pulau (Rp 300.000)
	return 300000.00
}

func (s *allowanceService) DetermineCurrency(destination models.City) string {
	if destination.IsForeign {
		return "USD"
	}
	return "IDR"
}

func (s *allowanceService) CalculateTotalAllowance(duration int, dailyAllowance float64) float64 {
	return float64(duration) * dailyAllowance
}
