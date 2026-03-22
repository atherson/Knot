package handlers

import (
	"campusconnect/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
}

func NewNotificationHandler(notificationService *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, _ := c.Get("userID")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	notifications, err := h.notificationService.GetNotifications(userID.(uint), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	unreadCount, _ := h.notificationService.GetUnreadCount(userID.(uint))

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count":  unreadCount,
		"page":          page,
		"limit":         limit,
	})
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID, _ := c.Get("userID")

	count, err := h.notificationService.GetUnreadCount(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"unread_count": count,
	})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification ID"})
		return
	}

	if err := h.notificationService.MarkAsRead(uint(notificationID), userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification marked as read",
	})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := h.notificationService.MarkAllAsRead(userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "All notifications marked as read",
	})
}

func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	userID, _ := c.Get("userID")
	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification ID"})
		return
	}

	if err := h.notificationService.DeleteNotification(uint(notificationID), userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification deleted",
	})
}

func (h *NotificationHandler) GetPreferences(c *gin.Context) {
	userID, _ := c.Get("userID")

	prefs, err := h.notificationService.GetPreferences(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"preferences": prefs,
	})
}

func (h *NotificationHandler) UpdatePreferences(c *gin.Context) {
	userID, _ := c.Get("userID")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prefs, err := h.notificationService.UpdatePreferences(userID.(uint), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Preferences updated successfully",
		"preferences": prefs,
	})
}
