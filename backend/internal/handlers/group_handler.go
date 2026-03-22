package handlers

import (
	"campusconnect/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type GroupHandler struct {
	groupService *services.GroupService
}

func NewGroupHandler(groupService *services.GroupService) *GroupHandler {
	return &GroupHandler{
		groupService: groupService,
	}
}

func (h *GroupHandler) CreateGroup(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Type        string `json:"type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	groupType := req.Type
	if groupType == "" {
		groupType = "public"
	}

	group, err := h.groupService.CreateGroup(userID.(uint), req.Name, req.Description, req.Category, groupType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Group created successfully",
		"group":   group,
	})
}

func (h *GroupHandler) GetGroups(c *gin.Context) {
	userID, _ := c.Get("userID")
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	groups, err := h.groupService.GetGroups(userID.(uint), category, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"page":   page,
		"limit":  limit,
	})
}

func (h *GroupHandler) GetGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
		return
	}

	group, err := h.groupService.GetGroupByID(uint(groupID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"group": group,
	})
}

func (h *GroupHandler) JoinGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
		return
	}

	if err := h.groupService.JoinGroup(userID.(uint), uint(groupID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Joined group successfully",
	})
}

func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
		return
	}

	if err := h.groupService.LeaveGroup(userID.(uint), uint(groupID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Left group successfully",
	})
}

func (h *GroupHandler) GetGroupPosts(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	posts, err := h.groupService.GetGroupPosts(uint(groupID), page, limit)
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

func (h *GroupHandler) GetMyGroups(c *gin.Context) {
	userID, _ := c.Get("userID")

	groups, err := h.groupService.GetUserGroups(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
	})
}
