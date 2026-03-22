package models

import (
	"time"

	"gorm.io/gorm"
)

type Notification struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"index;not null"`
	User      User           `json:"-" gorm:"foreignKey:UserID"`
	Type      string         `json:"type" gorm:"not null"` // like, comment, message, follow, group_invite, etc.
	Title     string         `json:"title"`
	Content   string         `json:"content"`
	Data      JSON           `json:"data" gorm:"type:jsonb"`
	IsRead    bool           `json:"is_read" gorm:"default:false"`
	ReadAt    *time.Time     `json:"read_at,omitempty"`
	ActorID   *uint          `json:"actor_id,omitempty"`
	Actor     *User          `json:"actor,omitempty" gorm:"foreignKey:ActorID"`
	TargetType string        `json:"target_type"` // post, comment, message, etc.
	TargetID  *uint          `json:"target_id,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type NotificationPreference struct {
	ID              uint   `json:"id" gorm:"primaryKey"`
	UserID          uint   `json:"user_id" gorm:"uniqueIndex;not null"`
	EmailLikes      bool   `json:"email_likes" gorm:"default:true"`
	EmailComments   bool   `json:"email_comments" gorm:"default:true"`
	EmailMessages   bool   `json:"email_messages" gorm:"default:true"`
	EmailGroups     bool   `json:"email_groups" gorm:"default:true"`
	PushLikes       bool   `json:"push_likes" gorm:"default:true"`
	PushComments    bool   `json:"push_comments" gorm:"default:true"`
	PushMessages    bool   `json:"push_messages" gorm:"default:true"`
	PushGroups      bool   `json:"push_groups" gorm:"default:true"`
	UpdatedAt       time.Time `json:"updated_at"`
}
