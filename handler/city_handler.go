// File: handler/city_handler.go
package handler

import (
	"net/http"
	"perdin-go/models"
	"perdin-go/repository"
	"strconv"

	"github.com/gin-gonic/gin"
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
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cities)
}

func (h *CityHandler) Create(c *gin.Context) {
	var city models.City
	if err := c.ShouldBindJSON(&city); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data salah"})
		return
	}

	savedCity, err := h.cityRepo.Save(city)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, savedCity)
}

func (h *CityHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	if !h.cityRepo.ExistsById(uint(id)) {
		c.JSON(http.StatusNotFound, gin.H{"message": "Kota tidak ditemukan"})
		return
	}

	err := h.cityRepo.DeleteById(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus kota (Mungkin sedang dipakai di data Perdin)"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Berhasil dihapus"})
}
