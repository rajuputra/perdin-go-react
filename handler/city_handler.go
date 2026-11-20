package handler

import (
	"errors"
	"net/http"
	"strings"

	"perdin-go/models"
	"perdin-go/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CityHandler struct {
	cityRepo repository.CityRepository
}

func NewCityHandler(cr repository.CityRepository) *CityHandler {
	return &CityHandler{cr}
}

func (h *CityHandler) GetAll(c *gin.Context) {
	cities, err := h.cityRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil daftar kota"})
		return
	}
	c.JSON(http.StatusOK, cities)
}

func bindCity(c *gin.Context) (models.City, bool) {
	var req struct {
		Name      string   `json:"name" binding:"required,max=150"`
		Latitude  *float64 `json:"latitude" binding:"required,gte=-90,lte=90"`
		Longitude *float64 `json:"longitude" binding:"required,gte=-180,lte=180"`
		Province  string   `json:"province" binding:"max=150"`
		Island    string   `json:"island" binding:"max=150"`
		IsForeign bool     `json:"isForeign"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data kota atau koordinat tidak valid"})
		return models.City{}, false
	}
	city := models.City{
		Name: strings.TrimSpace(req.Name), Latitude: *req.Latitude, Longitude: *req.Longitude,
		Province: strings.TrimSpace(req.Province), Island: strings.TrimSpace(req.Island), IsForeign: req.IsForeign,
	}
	if city.Name == "" || (!city.IsForeign && (city.Province == "" || city.Island == "")) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Nama kota wajib diisi. Kota dalam negeri memerlukan provinsi dan pulau."})
		return models.City{}, false
	}
	return city, true
}

func (h *CityHandler) Create(c *gin.Context) {
	city, ok := bindCity(c)
	if !ok {
		return
	}
	saved, err := h.cityRepo.Save(city)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat kota"})
		return
	}
	c.JSON(http.StatusOK, saved)
}

func (h *CityHandler) Update(c *gin.Context) {
	id, ok := pathID(c)
	if !ok {
		return
	}
	city, ok := bindCity(c)
	if !ok {
		return
	}
	city.ID = id
	cityResult(c, h.cityRepo.Update(city))
}

func (h *CityHandler) Delete(c *gin.Context) {
	id, ok := pathID(c)
	if !ok {
		return
	}
	cityResult(c, h.cityRepo.DeleteById(id))
}

func cityResult(c *gin.Context, err error) {
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		c.JSON(http.StatusNotFound, gin.H{"message": "Kota tidak ditemukan"})
	case errors.Is(err, gorm.ErrForeignKeyViolated):
		c.JSON(http.StatusConflict, gin.H{"message": "Kota sedang digunakan dalam pengajuan"})
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan perubahan kota"})
	default:
		c.Status(http.StatusNoContent)
	}
}
