package handler

import (
	"crypto/rand"
	"net/http"
	"perdin-go/dto"
	"perdin-go/models"
	"perdin-go/repository"
	"perdin-go/security"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo     repository.UserRepository
	sessions     *repository.SessionRepository
	jwt          *security.JWT
	secureCookie bool
}

const SessionCookie = "dinasflow_session"

func NewAuthHandler(ur repository.UserRepository, sessions *repository.SessionRepository, jwt *security.JWT, secureCookie bool) *AuthHandler {
	return &AuthHandler{ur, sessions, jwt, secureCookie}
}

func (h *AuthHandler) setCookie(c *gin.Context, value string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(SessionCookie, value, maxAge, "/api", "", h.secureCookie, true)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Password) > 72 {
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
	id := rand.Text()
	now := time.Now()
	token, err := h.jwt.Generate(user.ID, id, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal men-generate token"})
		return
	}

	if err := h.sessions.Create(models.Session{ID: id, UserID: user.ID, Version: user.SessionVersion, ExpiresAt: now.Add(security.SessionLifetime)}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat sesi"})
		return
	}

	h.setCookie(c, token, int(security.SessionLifetime.Seconds()))
	c.JSON(http.StatusOK, dto.LoginResponse{ID: user.ID, Username: user.Username, Role: user.Role})
}

func (h *AuthHandler) Me(c *gin.Context) {
	c.JSON(http.StatusOK, dto.LoginResponse{ID: c.GetUint("userId"), Username: c.GetString("username"), Role: c.GetString("role")})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	if token, err := c.Cookie(SessionCookie); err == nil {
		if claims, err := h.jwt.Validate(token); err == nil {
			if err := h.sessions.Delete(claims.ID); err != nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{"message": "Gagal mengakhiri sesi. Coba lagi."})
				return
			}
		}
	}
	h.setCookie(c, "", -1)
	c.Status(http.StatusNoContent)
}
