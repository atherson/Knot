package services

import (
	"campusconnect/internal/models"
	"campusconnect/internal/repository"
	"campusconnect/pkg/ai"
	"errors"

	"gorm.io/gorm"
)

type PostService struct {
	db       *gorm.DB
	redis    *repository.RedisClient
	aiService *ai.ModerationService
}

func NewPostService(db *gorm.DB, redis *repository.RedisClient, aiService *ai.ModerationService) *PostService {
	return &PostService{
		db:        db,
		redis:     redis,
		aiService: aiService,
	}
}

type CreatePostRequest struct {
	Content     string   `json:"content" binding:"required,min=1,max=2000"`
	Images      []string `json:"images"`
	IsAnonymous bool     `json:"is_anonymous"`
	GroupID     *uint    `json:"group_id,omitempty"`
}

func (s *PostService) CreatePost(userID uint, req *CreatePostRequest) (*models.Post, error) {
	// AI Moderation
	moderationResult := s.aiService.ModerateContent(req.Content)
	
	status := "approved"
	if !moderationResult.IsApproved {
		status = "pending"
	}

	post := &models.Post{
		UserID:      userID,
		Content:     req.Content,
		Status:      status,
		IsAnonymous: req.IsAnonymous,
		GroupID:     req.GroupID,
	}

	if err := s.db.Create(post).Error; err != nil {
		return nil, err
	}

	// Add images
	for i, url := range req.Images {
		image := models.PostImage{
			PostID: post.ID,
			URL:    url,
			Order:  i,
		}
		s.db.Create(&image)
	}

	// Save AI moderation result
	if s.aiService != nil {
		aiResult := moderationResult.ToModel(post.ID)
		s.db.Create(aiResult)
	}

	// Invalidate user's feed cache
	s.redis.InvalidateFeed(userID)

	// Load associations
	s.db.Preload("User").Preload("Images").First(post, post.ID)

	return post, nil
}

func (s *PostService) GetFeed(userID uint, page, limit int) ([]models.Post, error) {
	// Try cache first
	var cachedPosts []models.Post
	if err := s.redis.GetCachedFeed(userID, &cachedPosts); err == nil {
		return cachedPosts, nil
	}

	var posts []models.Post
	offset := (page - 1) * limit

	err := s.db.Preload("User").Preload("Images").Preload("AIResult").
		Where("status = ? AND (group_id IS NULL OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))", 
			"approved", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error

	if err != nil {
		return nil, err
	}

	// Cache the feed
	s.redis.CacheFeed(userID, posts, 5*60) // 5 minutes

	return posts, nil
}

func (s *PostService) GetPostByID(postID uint) (*models.Post, error) {
	var post models.Post
	if err := s.db.Preload("User").Preload("Images").Preload("Comments.User").Preload("AIResult").
		First(&post, postID).Error; err != nil {
		return nil, err
	}
	return &post, nil
}

func (s *PostService) DeletePost(userID, postID uint) error {
	var post models.Post
	if err := s.db.First(&post, postID).Error; err != nil {
		return err
	}

	if post.UserID != userID {
		return errors.New("unauthorized")
	}

	if err := s.db.Delete(&post).Error; err != nil {
		return err
	}

	// Invalidate cache
	s.redis.InvalidateFeed(userID)

	return nil
}

func (s *PostService) CreateComment(userID, postID uint, content string, parentID *uint) (*models.Comment, error) {
	// Check if post exists
	var post models.Post
	if err := s.db.First(&post, postID).Error; err != nil {
		return nil, err
	}

	comment := &models.Comment{
		PostID:   postID,
		UserID:   userID,
		Content:  content,
		ParentID: parentID,
	}

	if err := s.db.Create(comment).Error; err != nil {
		return nil, err
	}

	// Update post comment count
	s.db.Model(&models.Post{}).Where("id = ?", postID).
		Update("comments_count", s.db.Model(&models.Comment{}).Where("post_id = ?", postID).Select("count(*)"))

	// Load user
	s.db.Preload("User").First(comment, comment.ID)

	return comment, nil
}

func (s *PostService) LikePost(userID, postID uint) error {
	// Check if already liked
	var existingLike models.Like
	result := s.db.Where("user_id = ? AND post_id = ?", userID, postID).First(&existingLike)
	if result.Error == nil {
		return errors.New("already liked")
	}

	like := &models.Like{
		UserID: userID,
		PostID: postID,
	}

	if err := s.db.Create(like).Error; err != nil {
		return err
	}

	// Update post like count
	s.db.Model(&models.Post{}).Where("id = ?", postID).
		Update("likes_count", s.db.Model(&models.Like{}).Where("post_id = ?", postID).Select("count(*)"))

	return nil
}

func (s *PostService) UnlikePost(userID, postID uint) error {
	if err := s.db.Where("user_id = ? AND post_id = ?", userID, postID).Delete(&models.Like{}).Error; err != nil {
		return err
	}

	// Update post like count
	s.db.Model(&models.Post{}).Where("id = ?", postID).
		Update("likes_count", s.db.Model(&models.Like{}).Where("post_id = ?", postID).Select("count(*)"))

	return nil
}

func (s *PostService) GetPendingPosts(page, limit int) ([]models.Post, error) {
	var posts []models.Post
	offset := (page - 1) * limit

	err := s.db.Preload("User").Preload("AIResult").
		Where("status = ?", "pending").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error

	return posts, err
}

func (s *PostService) ModeratePost(postID uint, approved bool, reviewedBy uint) error {
	status := "rejected"
	if approved {
		status = "approved"
	}

	if err := s.db.Model(&models.Post{}).Where("id = ?", postID).Update("status", status).Error; err != nil {
		return err
	}

	// Update AI result
	now := s.db.NowFunc()
	if err := s.db.Model(&models.AIModerationResult{}).Where("post_id = ?", postID).
		Updates(map[string]interface{}{
			"is_approved": approved,
			"reviewed_by": reviewedBy,
			"reviewed_at": now,
		}).Error; err != nil {
		return err
	}

	return nil
}

func (s *PostService) ReportPost(reporterID, targetID uint, targetType, reason, description string) error {
	report := &models.Report{
		ReporterID:  reporterID,
		TargetType:  targetType,
		TargetID:    targetID,
		Reason:      reason,
		Description: description,
		Status:      "pending",
	}

	return s.db.Create(report).Error
}
