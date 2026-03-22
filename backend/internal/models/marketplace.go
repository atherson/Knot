package models

import (
	"time"

	"gorm.io/gorm"
)

type MarketplaceItem struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"index;not null"`
	User        User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Title       string         `json:"title" gorm:"not null"`
	Description string         `json:"description" gorm:"type:text"`
	Price       float64        `json:"price"`
	Currency    string         `json:"currency" gorm:"default:'USD'"`
	Category    string         `json:"category" gorm:"index"`
	Condition   string         `json:"condition"` // new, like_new, good, fair
	Images      []ItemImage    `json:"images,omitempty" gorm:"foreignKey:ItemID"`
	Status      string         `json:"status" gorm:"default:'active'"` // active, sold, reserved, deleted
	Course      string         `json:"course" gorm:"index"`
	Department  string         `json:"department" gorm:"index"`
	Location    string         `json:"location"`
	ViewsCount  int            `json:"views_count" gorm:"default:0"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type ItemImage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ItemID    uint      `json:"item_id" gorm:"index;not null"`
	URL       string    `json:"url" gorm:"not null"`
	Order     int       `json:"order" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
}

type ItemInquiry struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	ItemID      uint      `json:"item_id" gorm:"index;not null"`
	Item        MarketplaceItem `json:"-" gorm:"foreignKey:ItemID"`
	BuyerID     uint      `json:"buyer_id" gorm:"not null"`
	Buyer       User      `json:"buyer,omitempty" gorm:"foreignKey:BuyerID"`
	SellerID    uint      `json:"seller_id" gorm:"not null"`
	Message     string    `json:"message"`
	Status      string    `json:"status" gorm:"default:'pending'"` // pending, responded, closed
	CreatedAt   time.Time `json:"created_at"`
}
