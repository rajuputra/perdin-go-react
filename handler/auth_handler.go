package handler

import (
	"net/http"
	"perdin-go/dto"
	"perdin-go/repository"
	"perdin-go/security"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo repository.UserRepository
}

func NewAuthHandler(ur repository.UserRepository) *AuthHandler {
	return &AuthHandler{ur}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	// Cari user berdasarkan username
	user, err := h.userRepo.FindByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	// Verifikasi password Bcrypt
	if !security.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	// Generate JWT Token
	token, err := security.GenerateJWT(user.ID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal men-generate token"})
		return
	}

	c.JSON(http.StatusOK, dto.LoginResponse{
		Token:    token,
		Username: user.Username,
		Role:     user.Role,
	})
}
