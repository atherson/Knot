package services

import (
	"campusconnect/internal/models"
	"campusconnect/internal/repository"
	"errors"

	"gorm.io/gorm"
)

type MarketplaceService struct {
	db    *gorm.DB
	redis *repository.RedisClient
}

func NewMarketplaceService(db *gorm.DB, redis *repository.RedisClient) *MarketplaceService {
	return &MarketplaceService{
		db:    db,
		redis: redis,
	}
}

type CreateItemRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	Category    string   `json:"category"`
	Condition   string   `json:"condition"`
	Images      []string `json:"images"`
	Course      string   `json:"course"`
	Department  string   `json:"department"`
	Location    string   `json:"location"`
}

func (s *MarketplaceService) CreateItem(userID uint, req *CreateItemRequest) (*models.MarketplaceItem, error) {
	item := &models.MarketplaceItem{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Price:       req.Price,
		Currency:    req.Currency,
		Category:    req.Category,
		Condition:   req.Condition,
		Course:      req.Course,
		Department:  req.Department,
		Location:    req.Location,
		Status:      "active",
	}

	if err := s.db.Create(item).Error; err != nil {
		return nil, err
	}

	// Add images
	for i, url := range req.Images {
		image := models.ItemImage{
			ItemID: item.ID,
			URL:    url,
			Order:  i,
		}
		s.db.Create(&image)
	}

	// Load associations
	s.db.Preload("User").Preload("Images").First(item, item.ID)

	return item, nil
}

func (s *MarketplaceService) GetItems(filters map[string]interface{}, page, limit int) ([]models.MarketplaceItem, error) {
	var items []models.MarketplaceItem
	query := s.db.Preload("User").Preload("Images").Where("status = ?", "active")

	// Apply filters
	if category, ok := filters["category"].(string); ok && category != "" {
		query = query.Where("category = ?", category)
	}
	if course, ok := filters["course"].(string); ok && course != "" {
		query = query.Where("course = ?", course)
	}
	if department, ok := filters["department"].(string); ok && department != "" {
		query = query.Where("department = ?", department)
	}
	if minPrice, ok := filters["min_price"].(float64); ok && minPrice > 0 {
		query = query.Where("price >= ?", minPrice)
	}
	if maxPrice, ok := filters["max_price"].(float64); ok && maxPrice > 0 {
		query = query.Where("price <= ?", maxPrice)
	}
	if queryStr, ok := filters["query"].(string); ok && queryStr != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+queryStr+"%", "%"+queryStr+"%")
	}

	offset := (page - 1) * limit
	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error

	return items, err
}

func (s *MarketplaceService) GetItemByID(itemID uint) (*models.MarketplaceItem, error) {
	var item models.MarketplaceItem
	if err := s.db.Preload("User").Preload("Images").First(&item, itemID).Error; err != nil {
		return nil, err
	}

	// Increment views
	s.db.Model(&item).Update("views_count", item.ViewsCount+1)

	return &item, nil
}

func (s *MarketplaceService) UpdateItem(userID, itemID uint, updates map[string]interface{}) (*models.MarketplaceItem, error) {
	var item models.MarketplaceItem
	if err := s.db.First(&item, itemID).Error; err != nil {
		return nil, err
	}

	if item.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	if err := s.db.Model(&item).Updates(updates).Error; err != nil {
		return nil, err
	}

	s.db.Preload("User").Preload("Images").First(&item, itemID)
	return &item, nil
}

func (s *MarketplaceService) DeleteItem(userID, itemID uint) error {
	var item models.MarketplaceItem
	if err := s.db.First(&item, itemID).Error; err != nil {
		return err
	}

	if item.UserID != userID {
		return errors.New("unauthorized")
	}

	return s.db.Model(&item).Update("status", "deleted").Error
}

func (s *MarketplaceService) GetUserItems(userID uint) ([]models.MarketplaceItem, error) {
	var items []models.MarketplaceItem
	err := s.db.Preload("Images").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

func (s *MarketplaceService) CreateInquiry(buyerID, itemID uint, message string) (*models.ItemInquiry, error) {
	// Get item
	var item models.MarketplaceItem
	if err := s.db.First(&item, itemID).Error; err != nil {
		return nil, err
	}

	if item.UserID == buyerID {
		return nil, errors.New("cannot inquire about your own item")
	}

	inquiry := &models.ItemInquiry{
		ItemID:   itemID,
		BuyerID:  buyerID,
		SellerID: item.UserID,
		Message:  message,
		Status:   "pending",
	}

	if err := s.db.Create(inquiry).Error; err != nil {
		return nil, err
	}

	s.db.Preload("Buyer").First(inquiry, inquiry.ID)
	return inquiry, nil
}

func (s *MarketplaceService) GetCategories() ([]string, error) {
	var categories []string
	err := s.db.Model(&models.MarketplaceItem{}).
		Where("status = ?", "active").
		Distinct().
		Pluck("category", &categories).Error
	return categories, err
}
