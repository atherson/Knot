package handlers

import (
	"campusconnect/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	chatService *services.ChatService
}

func NewChatHandler(chatService *services.ChatService) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
	}
}

func (h *ChatHandler) GetConversations(c *gin.Context) {
	userID, _ := c.Get("userID")

	conversations, err := h.chatService.GetConversations(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": conversations,
	})
}

func (h *ChatHandler) GetMessages(c *gin.Context) {
	userID, _ := c.Get("userID")
	conversationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	messages, err := h.chatService.GetMessages(uint(conversationID), userID.(uint), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"page":     page,
		"limit":    limit,
	})
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	conversationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	var req struct {
		Content  string `json:"content" binding:"required"`
		Type     string `json:"type"`
		MediaURL string `json:"media_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msgType := req.Type
	if msgType == "" {
		msgType = "text"
	}

	message, err := h.chatService.SendMessage(uint(conversationID), userID.(uint), req.Content, msgType, req.MediaURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

func (h *ChatHandler) MarkAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	conversationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	if err := h.chatService.MarkMessagesAsRead(uint(conversationID), userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Messages marked as read",
	})
}

func (h *ChatHandler) StartConversation(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		UserID uint `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversation, err := h.chatService.GetOrCreateConversation(userID.(uint), req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversation": conversation,
	})
}

func (h *ChatHandler) BlockUser(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		UserID uint   `json:"user_id" binding:"required"`
		Reason string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.chatService.BlockUser(userID.(uint), req.UserID, req.Reason); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User blocked successfully",
	})
}

func (h *ChatHandler) UnblockUser(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		UserID uint `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.chatService.UnblockUser(userID.(uint), req.UserID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User unblocked successfully",
	})
}

func (h *ChatHandler) GetBlockedUsers(c *gin.Context) {
	userID, _ := c.Get("userID")

	blocked, err := h.chatService.GetBlockedUsers(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"blocked_users": blocked,
	})
}
