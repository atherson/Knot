package models

import (
	"time"

	"gorm.io/gorm"
)

type Conversation struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	Participant1ID uint     `json:"participant1_id" gorm:"index:idx_participants,unique;not null"`
	Participant2ID uint     `json:"participant2_id" gorm:"index:idx_participants,unique;not null"`
	LastMessageID *uint    `json:"last_message_id,omitempty"`
	LastMessage   *Message `json:"last_message,omitempty" gorm:"foreignKey:LastMessageID"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	Messages []Message `json:"messages,omitempty" gorm:"foreignKey:ConversationID"`
}

type Message struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	ConversationID uint           `json:"conversation_id" gorm:"index;not null"`
	Conversation   Conversation   `json:"-" gorm:"foreignKey:ConversationID"`
	SenderID       uint           `json:"sender_id" gorm:"index;not null"`
	Sender         User           `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Content        string         `json:"content" gorm:"not null"`
	Type           string         `json:"type" gorm:"default:'text'"` // text, image, file
	MediaURL       string         `json:"media_url,omitempty"`
	IsRead         bool           `json:"is_read" gorm:"default:false"`
	ReadAt         *time.Time     `json:"read_at,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

type BlockedUser struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"index:idx_block,unique;not null"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
	BlockedID uint      `json:"blocked_id" gorm:"index:idx_block,unique;not null"`
	Blocked   User      `json:"-" gorm:"foreignKey:BlockedID"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

type TypingStatus struct {
	UserID         uint      `json:"user_id"`
	ConversationID uint      `json:"conversation_id"`
	IsTyping       bool      `json:"is_typing"`
	Timestamp      time.Time `json:"timestamp"`
}
