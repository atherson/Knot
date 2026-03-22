package services

import (
	"campusconnect/internal/models"
	"campusconnect/internal/repository"
	"errors"

	"gorm.io/gorm"
)

type GroupService struct {
	db    *gorm.DB
	redis *repository.RedisClient
}

func NewGroupService(db *gorm.DB, redis *repository.RedisClient) *GroupService {
	return &GroupService{
		db:    db,
		redis: redis,
	}
}

func (s *GroupService) CreateGroup(userID uint, name, description, category string, groupType string) (*models.Group, error) {
	group := &models.Group{
		Name:        name,
		Description: description,
		Category:    category,
		Type:        groupType,
		CreatedBy:   userID,
	}

	if err := s.db.Create(group).Error; err != nil {
		return nil, err
	}

	// Add creator as admin
	member := &models.GroupMember{
		GroupID:  group.ID,
		UserID:   userID,
		Role:     "admin",
	}

	if err := s.db.Create(member).Error; err != nil {
		return nil, err
	}

	// Update member count
	s.db.Model(group).Update("members_count", 1)

	return group, nil
}

func (s *GroupService) GetGroups(userID uint, category string, page, limit int) ([]models.Group, error) {
	var groups []models.Group
	query := s.db.Preload("Members.User")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	offset := (page - 1) * limit
	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&groups).Error

	return groups, err
}

func (s *GroupService) GetGroupByID(groupID uint) (*models.Group, error) {
	var group models.Group
	if err := s.db.Preload("Members.User").Preload("Creator").First(&group, groupID).Error; err != nil {
		return nil, err
	}
	return &group, nil
}

func (s *GroupService) JoinGroup(userID, groupID uint) error {
	// Check if already a member
	var existingMember models.GroupMember
	result := s.db.Where("group_id = ? AND user_id = ?", groupID, userID).First(&existingMember)
	if result.Error == nil {
		return errors.New("already a member")
	}

	// Get group
	var group models.Group
	if err := s.db.First(&group, groupID).Error; err != nil {
		return err
	}

	// If private group, create join request
	if group.Type == "private" {
		request := &models.GroupJoinRequest{
			GroupID: groupID,
			UserID:  userID,
			Status:  "pending",
		}
		return s.db.Create(request).Error
	}

	// Add member
	member := &models.GroupMember{
		GroupID: groupID,
		UserID:  userID,
		Role:    "member",
	}

	if err := s.db.Create(member).Error; err != nil {
		return err
	}

	// Update member count
	s.db.Model(&group).Update("members_count", s.db.Model(&models.GroupMember{}).Where("group_id = ?", groupID).Select("count(*)"))

	return nil
}

func (s *GroupService) LeaveGroup(userID, groupID uint) error {
	// Check if admin and only admin
	var member models.GroupMember
	if err := s.db.Where("group_id = ? AND user_id = ?", groupID, userID).First(&member).Error; err != nil {
		return err
	}

	if member.Role == "admin" {
		var adminCount int64
		s.db.Model(&models.GroupMember{}).Where("group_id = ? AND role = ?", groupID, "admin").Count(&adminCount)
		if adminCount == 1 {
			return errors.New("cannot leave - you are the only admin")
		}
	}

	if err := s.db.Where("group_id = ? AND user_id = ?", groupID, userID).Delete(&models.GroupMember{}).Error; err != nil {
		return err
	}

	// Update member count
	s.db.Model(&models.Group{}).Where("id = ?", groupID).
		Update("members_count", s.db.Model(&models.GroupMember{}).Where("group_id = ?", groupID).Select("count(*)"))

	return nil
}

func (s *GroupService) GetGroupPosts(groupID uint, page, limit int) ([]models.Post, error) {
	var posts []models.Post
	offset := (page - 1) * limit

	err := s.db.Preload("User").Preload("Images").
		Where("group_id = ? AND status = ?", groupID, "approved").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error

	return posts, err
}

func (s *GroupService) GetUserGroups(userID uint) ([]models.Group, error) {
	var groups []models.Group
	err := s.db.Joins("JOIN group_members ON group_members.group_id = groups.id").
		Where("group_members.user_id = ?", userID).
		Find(&groups).Error
	return groups, err
}

func (s *GroupService) ApproveJoinRequest(requestID, adminID uint) error {
	var request models.GroupJoinRequest
	if err := s.db.First(&request, requestID).Error; err != nil {
		return err
	}

	// Verify admin
	var member models.GroupMember
	if err := s.db.Where("group_id = ? AND user_id = ? AND role IN ?", 
		request.GroupID, adminID, []string{"admin", "moderator"}).
		First(&member).Error; err != nil {
		return errors.New("unauthorized")
	}

	// Add member
	newMember := &models.GroupMember{
		GroupID: request.GroupID,
		UserID:  request.UserID,
		Role:    "member",
	}

	if err := s.db.Create(newMember).Error; err != nil {
		return err
	}

	// Update request
	request.Status = "approved"
	s.db.Save(&request)

	// Update member count
	s.db.Model(&models.Group{}).Where("id = ?", request.GroupID).
		Update("members_count", s.db.Model(&models.GroupMember{}).Where("group_id = ?", request.GroupID).Select("count(*)"))

	return nil
}
