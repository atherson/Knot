package config

import (
	"os"
	"strconv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Email    EmailConfig
	JWT      JWTConfig
	AI       AIConfig
}

type ServerConfig struct {
	Port         string
	Environment  string
	AllowOrigins []string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type EmailConfig struct {
	SendGridAPIKey string
	FromEmail      string
	FromName       string
}

type JWTConfig struct {
	Secret           string
	AccessTokenExpiry  int // minutes
	RefreshTokenExpiry int // hours
}

type AIConfig struct {
	Enabled          bool
	ModerationThreshold float64
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			Environment:  getEnv("ENVIRONMENT", "development"),
			AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "campusconnect"),
			Password: getEnv("DB_PASSWORD", "password"),
			DBName:   getEnv("DB_NAME", "campusconnect"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Email: EmailConfig{
			SendGridAPIKey: getEnv("SENDGRID_API_KEY", ""),
			FromEmail:      getEnv("FROM_EMAIL", "noreply@campusconnect.edu"),
			FromName:       getEnv("FROM_NAME", "CampusConnect"),
		},
		JWT: JWTConfig{
			Secret:           getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			AccessTokenExpiry:  getEnvAsInt("JWT_ACCESS_EXPIRY", 60),
			RefreshTokenExpiry: getEnvAsInt("JWT_REFRESH_EXPIRY", 168),
		},
		AI: AIConfig{
			Enabled:          getEnvAsBool("AI_ENABLED", true),
			ModerationThreshold: getEnvAsFloat("AI_THRESHOLD", 0.7),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

func getEnvAsFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			return floatVal
		}
	}
	return defaultValue
}
