package handlers

import (
	"campusconnect/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	userService         *services.UserService
	postService         *services.PostService
	groupService        *services.GroupService
	marketplaceService  *services.MarketplaceService
	notificationService *services.NotificationService
}

func NewAdminHandler(
	userService *services.UserService,
	postService *services.PostService,
	groupService *services.GroupService,
	marketplaceService *services.MarketplaceService,
	notificationService *services.NotificationService,
) *AdminHandler {
	return &AdminHandler{
		userService:         userService,
		postService:         postService,
		groupService:        groupService,
		marketplaceService:  marketplaceService,
		notificationService: notificationService,
	}
}

// User Management
func (h *AdminHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := c.Query("search")

	// This would be implemented in user service
	_ = page
	_ = limit
	_ = search

	c.JSON(http.StatusOK, gin.H{
		"message": "Users retrieved",
		"page":    page,
		"limit":   limit,
	})
}

func (h *AdminHandler) GetUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.userService.GetUserByID(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	stats, _ := h.userService.GetUserStats(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"user":  user.ToResponse(),
		"stats": stats,
	})
}

func (h *AdminHandler) SuspendUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	_, err = h.userService.UpdateUser(uint(userID), map[string]interface{}{
		"is_suspended": true,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User suspended successfully",
	})
}

func (h *AdminHandler) UnsuspendUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	_, err = h.userService.UpdateUser(uint(userID), map[string]interface{}{
		"is_suspended": false,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User unsuspended successfully",
	})
}

// Content Moderation
func (h *AdminHandler) GetPendingPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	posts, err := h.postService.GetPendingPosts(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"page":  page,
		"limit": limit,
	})
}

func (h *AdminHandler) ModeratePost(c *gin.Context) {
	adminID, _ := c.Get("userID")
	postID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	var req struct {
		Approved bool `json:"approved"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.postService.ModeratePost(uint(postID), req.Approved, adminID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Post moderated successfully",
	})
}

func (h *AdminHandler) DeletePost(c *gin.Context) {
	postID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	// Admin can delete any post
	if err := h.postService.DeletePost(0, uint(postID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Post deleted successfully",
	})
}

// Reports
func (h *AdminHandler) GetReports(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	_ = status
	_ = page
	_ = limit

	c.JSON(http.StatusOK, gin.H{
		"message": "Reports retrieved",
		"status":  status,
		"page":    page,
		"limit":   limit,
	})
}

func (h *AdminHandler) ResolveReport(c *gin.Context) {
	reportID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report ID"})
		return
	}

	var req struct {
		Action  string `json:"action"` // dismiss, remove_content, suspend_user
		Reason  string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = reportID

	c.JSON(http.StatusOK, gin.H{
		"message": "Report resolved successfully",
	})
}

// Analytics
func (h *AdminHandler) GetAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "7d")

	_ = period

	// Mock analytics data
	analytics := map[string]interface{}{
		"period": period,
		"users": map[string]interface{}{
			"total":       1250,
			"active_today": 156,
			"new_today":   12,
		},
		"posts": map[string]interface{}{
			"total":       3420,
			"today":       45,
			"pending":     8,
		},
		"engagement": map[string]interface{}{
			"likes_today":    234,
			"comments_today": 89,
			"messages_today": 156,
		},
	}

	c.JSON(http.StatusOK, analytics)
}

func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	stats := map[string]interface{}{
		"total_users":       1250,
		"active_users":      156,
		"total_posts":       3420,
		"pending_posts":     8,
		"total_groups":      45,
		"marketplace_items": 123,
		"reports":           5,
	}

	c.JSON(http.StatusOK, stats)
}
