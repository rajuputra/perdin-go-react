package handler

import (
	"errors"
	"net/http"
	"perdin-go/models"
	"perdin-go/repository"
	"perdin-go/security"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	userRepo repository.UserRepository
}

func NewUserHandler(ur repository.UserRepository) *UserHandler {
	return &UserHandler{ur}
}

// Request Payload khusus Create User
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,max=100"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=ADMIN PEGAWAI DIVISI_SDM"`
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data salah"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || len(req.Password) < 12 || len(req.Password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Username wajib diisi dan kata sandi harus 12–72 byte"})
		return
	}

	// Hash password sebelum di-save!
	hashedPassword, err := security.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses password"})
		return
	}

	newUser := models.User{
		Username: req.Username,
		Password: hashedPassword,
		Role:     req.Role,
	}

	savedUser, err := h.userRepo.Save(newUser)
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			c.JSON(http.StatusConflict, gin.H{"message": "Username sudah terdaftar"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat pengguna"})
		return
	}

	// Kembalikan response tanpa password
	c.JSON(http.StatusOK, gin.H{
		"id":       savedUser.ID,
		"username": savedUser.Username,
		"role":     savedUser.Role,
	})
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, ok := pathID(c)
	if !ok {
		return
	}
	var req struct {
		Role     string `json:"role" binding:"required,oneof=ADMIN PEGAWAI DIVISI_SDM"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || (req.Password != "" && (len(req.Password) < 12 || len(req.Password) > 72)) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Peran atau kata sandi tidak valid"})
		return
	}
	var hash string
	if req.Password != "" {
		var err error
		hash, err = security.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memproses kata sandi"})
			return
		}
	}
	switch err := h.userRepo.UpdateAccess(c.GetUint("userId"), id, req.Role, hash); {
	case errors.Is(err, gorm.ErrRecordNotFound):
		c.JSON(http.StatusNotFound, gin.H{"message": "Pengguna tidak ditemukan"})
	case errors.Is(err, repository.ErrAdminRequired):
		c.JSON(http.StatusConflict, gin.H{"message": "Perubahan ditolak. Minimal satu administrator harus tetap aktif."})
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui pengguna"})
	default:
		c.Status(http.StatusNoContent)
	}
}

// DTO untuk Response Data User (Tanpa Password)
type UserResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// Fungsi mengambil list user
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil pengguna"})
		return
	}

	// Mapping dari model ke DTO
	res := make([]UserResponse, 0, len(users))
	for _, u := range users {
		res = append(res, UserResponse{
			ID:       u.ID,
			Username: u.Username,
			Role:     u.Role,
		})
	}

	c.JSON(http.StatusOK, res)
}
