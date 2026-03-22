package models

import (
	"time"

	"gorm.io/gorm"
)

type Group struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Avatar      string         `json:"avatar"`
	Type        string         `json:"type" gorm:"default:'public'"` // public, private
	Category    string         `json:"category"` // department, course, club, event
	CreatedBy   uint           `json:"created_by" gorm:"not null"`
	Creator     User           `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	MembersCount int           `json:"members_count" gorm:"default:0"`
	PostsCount   int           `json:"posts_count" gorm:"default:0"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Members []GroupMember `json:"members,omitempty" gorm:"foreignKey:GroupID"`
	Posts   []Post        `json:"posts,omitempty" gorm:"foreignKey:GroupID"`
}

type GroupMember struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	GroupID   uint      `json:"group_id" gorm:"index:idx_group_member,unique;not null"`
	Group     Group     `json:"-" gorm:"foreignKey:GroupID"`
	UserID    uint      `json:"user_id" gorm:"index:idx_group_member,unique;not null"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Role      string    `json:"role" gorm:"default:'member'"` // admin, moderator, member
	JoinedAt  time.Time `json:"joined_at"`
}

type GroupJoinRequest struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	GroupID   uint      `json:"group_id" gorm:"index;not null"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Status    string    `json:"status" gorm:"default:'pending'"` // pending, approved, rejected
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
