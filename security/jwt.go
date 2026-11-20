package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// --- BCRYPT (Password Hashing) ---
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// --- JWT ---
type JWT struct {
	key []byte
}

const SessionLifetime = 8 * time.Hour

func NewJWT(secret string) (*JWT, error) {
	if len(secret) < 32 {
		return nil, errors.New("JWT_SECRET harus berisi minimal 32 byte")
	}
	return &JWT{key: []byte(secret)}, nil
}

// Custom Claims (Payload JWT)
type JWTClaim struct {
	UserID   uint   `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func (j *JWT) Generate(userID uint, sessionID string, now time.Time) (string, error) {
	claims := &JWTClaim{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        sessionID,
			ExpiresAt: jwt.NewNumericDate(now.Add(SessionLifetime)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.key)
}

func (j *JWT) Validate(signedToken string) (*JWTClaim, error) {
	token, err := jwt.ParseWithClaims(
		signedToken,
		&JWTClaim{},
		func(token *jwt.Token) (interface{}, error) {
			return j.key, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*JWTClaim)
	if !ok || !token.Valid || claims.ID == "" || claims.UserID == 0 {
		return nil, errors.New("token tidak valid")
	}
	return claims, nil
}
