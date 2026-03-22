package auth

import (
	"campusconnect/internal/config"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type JWTManager struct {
	config *config.JWTConfig
}

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	IsAdmin bool  `json:"is_admin"`
	jwt.RegisteredClaims
}

func NewJWTManager(cfg *config.JWTConfig) *JWTManager {
	return &JWTManager{config: cfg}
}

func (j *JWTManager) GenerateToken(userID uint, email string, isAdmin bool) (string, error) {
	claims := Claims{
		UserID:  userID,
		Email:   email,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(j.config.AccessTokenExpiry) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.Secret))
}

func (j *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.config.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token claims")
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func HashOTP(otp string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(otp), bcrypt.DefaultCost)
	return string(bytes), err
}

func VerifyOTP(otp, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(otp))
	return err == nil
}
