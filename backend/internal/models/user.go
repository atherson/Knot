package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	Email             string         `json:"email" gorm:"uniqueIndex;not null"`
	Name              string         `json:"name"`
	Avatar            string         `json:"avatar"`
	Bio               string         `json:"bio"`
	Department        string         `json:"department"`
	Course            string         `json:"course"`
	YearOfStudy       int            `json:"year_of_study"`
	IsVerified        bool           `json:"is_verified" gorm:"default:false"`
	IsAdmin           bool           `json:"is_admin" gorm:"default:false"`
	IsSuspended       bool           `json:"is_suspended" gorm:"default:false"`
	LastActiveAt      *time.Time     `json:"last_active_at"`
	OnlineStatus      string         `json:"online_status" gorm:"default:'offline'"`
	NotificationPrefs JSON           `json:"notification_prefs" gorm:"type:jsonb;default:'{}'"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Posts         []Post         `json:"posts,omitempty" gorm:"foreignKey:UserID"`
	Comments      []Comment      `json:"comments,omitempty" gorm:"foreignKey:UserID"`
	Likes         []Like         `json:"likes,omitempty" gorm:"foreignKey:UserID"`
	SentMessages  []Message      `json:"sent_messages,omitempty" gorm:"foreignKey:SenderID"`
	Groups        []GroupMember  `json:"groups,omitempty" gorm:"foreignKey:UserID"`
	MarketplaceItems []MarketplaceItem `json:"marketplace_items,omitempty" gorm:"foreignKey:UserID"`
}

type UserResponse struct {
	ID           uint      `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	Avatar       string    `json:"avatar"`
	Bio          string    `json:"bio"`
	Department   string    `json:"department"`
	Course       string    `json:"course"`
	YearOfStudy  int       `json:"year_of_study"`
	OnlineStatus string    `json:"online_status"`
	LastActiveAt *time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:           u.ID,
		Email:        u.Email,
		Name:         u.Name,
		Avatar:       u.Avatar,
		Bio:          u.Bio,
		Department:   u.Department,
		Course:       u.Course,
		YearOfStudy:  u.YearOfStudy,
		OnlineStatus: u.OnlineStatus,
		LastActiveAt: u.LastActiveAt,
		CreatedAt:    u.CreatedAt,
	}
}

type OTP struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"index;not null"`
	Code      string    `json:"-" gorm:"not null"`
	Hash      string    `json:"-" gorm:"not null"`
	Attempts  int       `json:"attempts" gorm:"default:0"`
	MaxAttempts int     `json:"max_attempts" gorm:"default:3"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
}

type Device struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
	DeviceID  string    `json:"device_id" gorm:"not null"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	IP        string    `json:"ip"`
	UserAgent string    `json:"user_agent"`
	LastUsed  time.Time `json:"last_used"`
	CreatedAt time.Time `json:"created_at"`
}

type JSON map[string]interface{}
