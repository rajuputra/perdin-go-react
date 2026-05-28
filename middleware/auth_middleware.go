package middleware

import (
	"net/http"
	"perdin-go/security"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware mengecek apakah token JWT valid
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token format"})
			c.Abort()
			return
		}

		claims, err := security.ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Token kadaluarsa atau tidak valid"})
			c.Abort()
			return
		}

		// Simpan data user ke context Gin agar bisa dipakai di Handler
		c.Set("userId", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
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
