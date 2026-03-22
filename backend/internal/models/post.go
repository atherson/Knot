package models

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"index;not null"`
	User        User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Content     string         `json:"content" gorm:"type:text;not null"`
	Images      []PostImage    `json:"images,omitempty" gorm:"foreignKey:PostID"`
	Status      string         `json:"status" gorm:"default:'pending'"` // pending, approved, rejected
	AIResult    *AIModerationResult `json:"ai_result,omitempty" gorm:"foreignKey:PostID"`
	LikesCount  int            `json:"likes_count" gorm:"default:0"`
	CommentsCount int         `json:"comments_count" gorm:"default:0"`
	IsAnonymous bool           `json:"is_anonymous" gorm:"default:false"`
	GroupID     *uint          `json:"group_id,omitempty"`
	Group       *Group         `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Likes    []Like    `json:"likes,omitempty" gorm:"foreignKey:PostID"`
	Comments []Comment `json:"comments,omitempty" gorm:"foreignKey:PostID"`
}

type PostImage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PostID    uint      `json:"post_id" gorm:"index;not null"`
	URL       string    `json:"url" gorm:"not null"`
	Order     int       `json:"order" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	PostID    uint           `json:"post_id" gorm:"index;not null"`
	Post      Post           `json:"-" gorm:"foreignKey:PostID"`
	UserID    uint           `json:"user_id" gorm:"index;not null"`
	User      User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Content   string         `json:"content" gorm:"not null"`
	ParentID  *uint          `json:"parent_id,omitempty"`
	Replies   []Comment      `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type Like struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PostID    uint      `json:"post_id" gorm:"uniqueIndex:idx_user_post_like;not null"`
	Post      Post      `json:"-" gorm:"foreignKey:PostID"`
	UserID    uint      `json:"user_id" gorm:"uniqueIndex:idx_user_post_like;not null"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
	CreatedAt time.Time `json:"created_at"`
}

type AIModerationResult struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	PostID        uint      `json:"post_id" gorm:"uniqueIndex;not null"`
	IsApproved    bool      `json:"is_approved"`
	Score         float64   `json:"score"`
	Categories    JSON      `json:"categories" gorm:"type:jsonb"`
	Reason        string    `json:"reason"`
	ReviewedBy    *uint     `json:"reviewed_by,omitempty"`
	ReviewedAt    *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type Report struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	ReporterID   uint      `json:"reporter_id" gorm:"index;not null"`
	Reporter     User      `json:"reporter,omitempty" gorm:"foreignKey:ReporterID"`
	TargetType   string    `json:"target_type" gorm:"not null"` // post, comment, user
	TargetID     uint      `json:"target_id" gorm:"not null"`
	Reason       string    `json:"reason" gorm:"not null"`
	Description  string    `json:"description"`
	Status       string    `json:"status" gorm:"default:'pending'"` // pending, resolved, dismissed
	ResolvedBy   *uint     `json:"resolved_by,omitempty"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
