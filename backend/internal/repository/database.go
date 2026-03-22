package repository

import (
	"campusconnect/internal/config"
	"campusconnect/internal/models"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB *gorm.DB
}

func NewDatabase(cfg *config.DatabaseConfig) (*Database, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return &Database{DB: db}, nil
}

func (d *Database) Migrate() error {
	return d.DB.AutoMigrate(
		&models.User{},
		&models.OTP{},
		&models.Device{},
		&models.Post{},
		&models.PostImage{},
		&models.Comment{},
		&models.Like{},
		&models.AIModerationResult{},
		&models.Report{},
		&models.Conversation{},
		&models.Message{},
		&models.BlockedUser{},
		&models.Group{},
		&models.GroupMember{},
		&models.GroupJoinRequest{},
		&models.MarketplaceItem{},
		&models.ItemImage{},
		&models.ItemInquiry{},
		&models.Notification{},
		&models.NotificationPreference{},
	)
}
