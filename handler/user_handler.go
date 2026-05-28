// File: handler/user_handler.go
package handler

import (
	"net/http"
	"perdin-go/models"
	"perdin-go/repository"
	"perdin-go/security"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userRepo repository.UserRepository
}

func NewUserHandler(ur repository.UserRepository) *UserHandler {
	return &UserHandler{ur}
}

// Request Payload khusus Create User
type CreateUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data salah"})
		return
	}

	if h.userRepo.ExistsByUsername(req.Username) {
		c.JSON(http.StatusConflict, gin.H{"message": "Username sudah terdaftar"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	// Kembalikan response tanpa password
	c.JSON(http.StatusOK, gin.H{
		"id":       savedUser.ID,
		"username": savedUser.Username,
		"role":     savedUser.Role,
	})
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
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	// Mapping dari model ke DTO
	var res []UserResponse
	for _, u := range users {
		res = append(res, UserResponse{
			ID:       u.ID,
			Username: u.Username,
			Role:     u.Role,
		})
	}

	c.JSON(http.StatusOK, res)
}
