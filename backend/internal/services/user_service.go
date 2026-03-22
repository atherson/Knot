package services

import (
	"campusconnect/internal/models"
	"campusconnect/internal/repository"
	"campusconnect/pkg/auth"
	"campusconnect/pkg/email"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"gorm.io/gorm"
)

type UserService struct {
	db           *gorm.DB
	redis        *repository.RedisClient
	emailService *email.EmailService
	jwtManager   *auth.JWTManager
}

func NewUserService(db *gorm.DB, redis *repository.RedisClient, emailService *email.EmailService, jwtManager *auth.JWTManager) *UserService {
	return &UserService{
		db:           db,
		redis:        redis,
		emailService: emailService,
		jwtManager:   jwtManager,
	}
}

func (s *UserService) GenerateOTP() (string, error) {
	// Generate 6-digit numeric OTP
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()+100000), nil
}

func (s *UserService) RequestOTP(email string) error {
	// Check if user exists, if not create one
	var user models.User
	result := s.db.Where("email = ?", email).First(&user)
	if result.Error == gorm.ErrRecordNotFound {
		user = models.User{
			Email:      email,
			IsVerified: false,
		}
		if err := s.db.Create(&user).Error; err != nil {
			return err
		}
	}

	// Check for existing OTP
	var existingOTP models.OTP
	s.db.Where("email = ? AND used = ? AND expires_at > ?", email, false, time.Now()).
		Order("created_at DESC").First(&existingOTP)

	if existingOTP.ID != 0 {
		// Check if enough time has passed since last OTP (1 minute)
		if time.Since(existingOTP.CreatedAt) < time.Minute {
			return fmt.Errorf("please wait before requesting a new OTP")
		}
	}

	// Generate new OTP
	otpCode, err := s.GenerateOTP()
	if err != nil {
		return err
	}

	// Hash OTP
	otpHash, err := auth.HashOTP(otpCode)
	if err != nil {
		return err
	}

	// Save OTP to database
	otp := models.OTP{
		Email:     email,
		Code:      otpCode, // Store plain for development, remove in production
		Hash:      otpHash,
		ExpiresAt: time.Now().Add(10 * time.Minute),
		MaxAttempts: 3,
	}

	if err := s.db.Create(&otp).Error; err != nil {
		return err
	}

	// Send email
	if s.emailService != nil {
		if err := s.emailService.SendOTPEmail(email, otpCode); err != nil {
			// Log error but don't fail - in development, we can show OTP
			fmt.Printf("Failed to send email: %v\n", err)
		}
	}

	return nil
}

func (s *UserService) VerifyOTP(email, code string) (*models.User, string, error) {
	var otp models.OTP
	result := s.db.Where("email = ? AND used = ? AND expires_at > ?", email, false, time.Now()).
		Order("created_at DESC").First(&otp)

	if result.Error != nil {
		return nil, "", fmt.Errorf("OTP expired or not found")
	}

	// Check attempts
	if otp.Attempts >= otp.MaxAttempts {
		return nil, "", fmt.Errorf("maximum attempts exceeded")
	}

	// Increment attempts
	otp.Attempts++
	s.db.Save(&otp)

	// Verify OTP
	if !auth.VerifyOTP(code, otp.Hash) {
		return nil, "", fmt.Errorf("invalid OTP")
	}

	// Mark OTP as used
	otp.Used = true
	s.db.Save(&otp)

	// Get or create user
	var user models.User
	result = s.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		return nil, "", result.Error
	}

	// Mark user as verified
	if !user.IsVerified {
		user.IsVerified = true
		s.db.Save(&user)
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user.ID, user.Email, user.IsAdmin)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func (s *UserService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateUser(userID uint, updates map[string]interface{}) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&user).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) UpdateOnlineStatus(userID uint, status string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"online_status":  status,
		"last_active_at": now,
	}
	
	if err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return err
	}

	// Update Redis
	if status == "online" {
		s.redis.SetUserOnline(userID, 5*time.Minute)
	} else {
		s.redis.SetUserOffline(userID)
	}

	return nil
}

func (s *UserService) SearchUsers(query string, limit int) ([]models.UserResponse, error) {
	var users []models.User
	if err := s.db.Where("name ILIKE ? OR email ILIKE ?", "%"+query+"%", "%"+query+"%").
		Limit(limit).Find(&users).Error; err != nil {
		return nil, err
	}

	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse()
	}
	return responses, nil
}

func (s *UserService) GetUserStats(userID uint) (map[string]interface{}, error) {
	var postCount, commentCount, likeCount int64
	
	s.db.Model(&models.Post{}).Where("user_id = ?", userID).Count(&postCount)
	s.db.Model(&models.Comment{}).Where("user_id = ?", userID).Count(&commentCount)
	s.db.Model(&models.Like{}).Where("user_id = ?", userID).Count(&likeCount)

	return map[string]interface{}{
		"posts_count":    postCount,
		"comments_count": commentCount,
		"likes_count":    likeCount,
	}, nil
}
