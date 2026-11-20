package middleware

import (
	"net/http"
	"perdin-go/repository"
	"perdin-go/security"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware mengecek apakah token JWT valid
func AuthMiddleware(jwt *security.JWT, sessions *repository.SessionRepository, cookieName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(cookieName)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Silakan masuk"})
			c.Abort()
			return
		}

		claims, err := jwt.Validate(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Token kadaluarsa atau tidak valid"})
			c.Abort()
			return
		}

		// Simpan data user ke context Gin agar bisa dipakai di Handler
		user, err := sessions.User(claims.ID, claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Sesi tidak berlaku"})
			return
		}
		c.Set("userId", user.ID)
		c.Set("username", user.Username)
		c.Set("role", user.Role)
		c.Next()
	}
}

// RequireRole membatasi akses berdasarkan role
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak"})
			c.Abort()
			return
		}

		roleStr := userRole.(string)
		isAllowed := false
		for _, role := range allowedRoles {
			if role == roleStr {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{"message": "Anda tidak memiliki izin (403)"})
			c.Abort()
			return
		}
		c.Next()
	}
}
