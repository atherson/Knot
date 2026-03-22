package services

import (
	"campusconnect/internal/models"
	"campusconnect/internal/repository"
	"encoding/json"

	"gorm.io/gorm"
)

type NotificationService struct {
	db    *gorm.DB
	redis *repository.RedisClient
}

func NewNotificationService(db *gorm.DB, redis *repository.RedisClient) *NotificationService {
	return &NotificationService{
		db:    db,
		redis: redis,
	}
}

func (s *NotificationService) CreateNotification(userID uint, notifType, title, content string, actorID *uint, targetType string, targetID *uint, data map[string]interface{}) (*models.Notification, error) {
	notification := &models.Notification{
		UserID:     userID,
		Type:       notifType,
		Title:      title,
		Content:    content,
		ActorID:    actorID,
		TargetType: targetType,
		TargetID:   targetID,
		Data:       data,
		IsRead:     false,
	}

	if err := s.db.Create(notification).Error; err != nil {
		return nil, err
	}

	// Invalidate notification count cache
	s.redis.Delete("notif_count:" + string(rune(userID)))

	return notification, nil
}

func (s *NotificationService) GetNotifications(userID uint, page, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	offset := (page - 1) * limit

	err := s.db.Preload("Actor").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&notifications).Error

	return notifications, err
}

func (s *NotificationService) GetUnreadCount(userID uint) (int64, error) {
	var count int64
	err := s.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (s *NotificationService) MarkAsRead(notificationID, userID uint) error {
	return s.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (s *NotificationService) MarkAllAsRead(userID uint) error {
	return s.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

func (s *NotificationService) DeleteNotification(notificationID, userID uint) error {
	return s.db.Where("id = ? AND user_id = ?", notificationID, userID).Delete(&models.Notification{}).Error
}

func (s *NotificationService) GetPreferences(userID uint) (*models.NotificationPreference, error) {
	var prefs models.NotificationPreference
	result := s.db.Where("user_id = ?", userID).First(&prefs)
	
	if result.Error != nil {
		// Create default preferences
		prefs = models.NotificationPreference{
			UserID:        userID,
			EmailLikes:    true,
			EmailComments: true,
			EmailMessages: true,
			EmailGroups:   true,
			PushLikes:     true,
			PushComments:  true,
			PushMessages:  true,
			PushGroups:    true,
		}
		if err := s.db.Create(&prefs).Error; err != nil {
			return nil, err
		}
	}

	return &prefs, nil
}

func (s *NotificationService) UpdatePreferences(userID uint, updates map[string]interface{}) (*models.NotificationPreference, error) {
	prefs, err := s.GetPreferences(userID)
	if err != nil {
		return nil, err
	}

	if err := s.db.Model(prefs).Updates(updates).Error; err != nil {
		return nil, err
	}

	return prefs, nil
}

// Notification triggers
func (s *NotificationService) NotifyLike(userID uint, actorID uint, postID uint) {
	s.CreateNotification(userID, "like", "New Like", "Someone liked your post", &actorID, "post", &postID, map[string]interface{}{
		"post_id": postID,
	})
}

func (s *NotificationService) NotifyComment(userID uint, actorID uint, postID uint, commentID uint) {
	s.CreateNotification(userID, "comment", "New Comment", "Someone commented on your post", &actorID, "post", &postID, map[string]interface{}{
		"post_id":    postID,
		"comment_id": commentID,
	})
}

func (s *NotificationService) NotifyMessage(userID uint, actorID uint, conversationID uint) {
	s.CreateNotification(userID, "message", "New Message", "You have a new message", &actorID, "conversation", &conversationID, map[string]interface{}{
		"conversation_id": conversationID,
	})
}

func (s *NotificationService) NotifyGroupInvite(userID uint, actorID uint, groupID uint) {
	s.CreateNotification(userID, "group_invite", "Group Invitation", "You've been invited to join a group", &actorID, "group", &groupID, map[string]interface{}{
		"group_id": groupID,
	})
}

func (s *NotificationService) NotifyGroupPost(userID uint, actorID uint, groupID uint, postID uint) {
	s.CreateNotification(userID, "group_post", "New Group Post", "New post in your group", &actorID, "group", &groupID, map[string]interface{}{
		"group_id": groupID,
		"post_id":  postID,
	})
}

func (s *NotificationService) SendToWebSocket(userID uint, notification *models.Notification) {
	// This will be handled by the WebSocket manager
	data, _ := json.Marshal(notification)
	_ = data
	// WebSocketManager.SendToUser(userID, data)
}
