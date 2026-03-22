package services

import (
	"campusconnect/internal/models"
	"campusconnect/internal/repository"
	"errors"

	"gorm.io/gorm"
)

type ChatService struct {
	db    *gorm.DB
	redis *repository.RedisClient
}

func NewChatService(db *gorm.DB, redis *repository.RedisClient) *ChatService {
	return &ChatService{
		db:    db,
		redis: redis,
	}
}

func (s *ChatService) GetOrCreateConversation(userID1, userID2 uint) (*models.Conversation, error) {
	// Check for existing conversation
	var conversation models.Conversation
	result := s.db.Where(
		"(participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?)",
		userID1, userID2, userID2, userID1,
	).First(&conversation)

	if result.Error == nil {
		return &conversation, nil
	}

	// Create new conversation
	conversation = models.Conversation{
		Participant1ID: userID1,
		Participant2ID: userID2,
	}

	if err := s.db.Create(&conversation).Error; err != nil {
		return nil, err
	}

	return &conversation, nil
}

func (s *ChatService) GetConversations(userID uint) ([]models.Conversation, error) {
	var conversations []models.Conversation
	
	err := s.db.Preload("LastMessage.Sender").
		Where("participant1_id = ? OR participant2_id = ?", userID, userID).
		Order("updated_at DESC").
		Find(&conversations).Error

	return conversations, err
}

func (s *ChatService) GetMessages(conversationID, userID uint, page, limit int) ([]models.Message, error) {
	// Verify user is part of conversation
	var conversation models.Conversation
	if err := s.db.First(&conversation, conversationID).Error; err != nil {
		return nil, err
	}

	if conversation.Participant1ID != userID && conversation.Participant2ID != userID {
		return nil, errors.New("unauthorized")
	}

	var messages []models.Message
	offset := (page - 1) * limit

	err := s.db.Preload("Sender").
		Where("conversation_id = ?", conversationID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&messages).Error

	return messages, err
}

func (s *ChatService) SendMessage(conversationID, senderID uint, content, msgType, mediaURL string) (*models.Message, error) {
	// Verify sender is part of conversation
	var conversation models.Conversation
	if err := s.db.First(&conversation, conversationID).Error; err != nil {
		return nil, err
	}

	if conversation.Participant1ID != senderID && conversation.Participant2ID != senderID {
		return nil, errors.New("unauthorized")
	}

	// Check if user is blocked
	var blockedCount int64
	s.db.Model(&models.BlockedUser{}).
		Where("(user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)",
			conversation.Participant1ID, conversation.Participant2ID,
			conversation.Participant2ID, conversation.Participant1ID).
		Count(&blockedCount)

	if blockedCount > 0 {
		return nil, errors.New("cannot send message - user blocked")
	}

	message := &models.Message{
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        content,
		Type:           msgType,
		MediaURL:       mediaURL,
	}

	if err := s.db.Create(message).Error; err != nil {
		return nil, err
	}

	// Update conversation's last message
	s.db.Model(&conversation).Update("last_message_id", message.ID)

	// Load sender
	s.db.Preload("Sender").First(message, message.ID)

	return message, nil
}

func (s *ChatService) MarkMessagesAsRead(conversationID, userID uint) error {
	return s.db.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": s.db.NowFunc(),
		}).Error
}

func (s *ChatService) BlockUser(userID, blockedID uint, reason string) error {
	if userID == blockedID {
		return errors.New("cannot block yourself")
	}

	block := &models.BlockedUser{
		UserID:    userID,
		BlockedID: blockedID,
		Reason:    reason,
	}

	return s.db.Create(block).Error
}

func (s *ChatService) UnblockUser(userID, blockedID uint) error {
	return s.db.Where("user_id = ? AND blocked_id = ?", userID, blockedID).Delete(&models.BlockedUser{}).Error
}

func (s *ChatService) GetBlockedUsers(userID uint) ([]models.BlockedUser, error) {
	var blocked []models.BlockedUser
	err := s.db.Preload("Blocked").Where("user_id = ?", userID).Find(&blocked).Error
	return blocked, err
}

func (s *ChatService) IsBlocked(userID, otherID uint) bool {
	var count int64
	s.db.Model(&models.BlockedUser{}).
		Where("(user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)",
			userID, otherID, otherID, userID).
		Count(&count)
	return count > 0
}
