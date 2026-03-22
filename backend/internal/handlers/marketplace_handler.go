package handlers

import (
	"campusconnect/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MarketplaceHandler struct {
	marketplaceService *services.MarketplaceService
}

func NewMarketplaceHandler(marketplaceService *services.MarketplaceService) *MarketplaceHandler {
	return &MarketplaceHandler{
		marketplaceService: marketplaceService,
	}
}

func (h *MarketplaceHandler) CreateItem(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req services.CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.marketplaceService.CreateItem(userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Item created successfully",
		"item":    item,
	})
}

func (h *MarketplaceHandler) GetItems(c *gin.Context) {
	filters := make(map[string]interface{})

	if category := c.Query("category"); category != "" {
		filters["category"] = category
	}
	if course := c.Query("course"); course != "" {
		filters["course"] = course
	}
	if department := c.Query("department"); department != "" {
		filters["department"] = department
	}
	if minPrice := c.Query("min_price"); minPrice != "" {
		if price, err := strconv.ParseFloat(minPrice, 64); err == nil {
			filters["min_price"] = price
		}
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		if price, err := strconv.ParseFloat(maxPrice, 64); err == nil {
			filters["max_price"] = price
		}
	}
	if query := c.Query("q"); query != "" {
		filters["query"] = query
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, err := h.marketplaceService.GetItems(filters, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"page":  page,
		"limit": limit,
	})
}

func (h *MarketplaceHandler) GetItem(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	item, err := h.marketplaceService.GetItemByID(uint(itemID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"item": item,
	})
}

func (h *MarketplaceHandler) UpdateItem(c *gin.Context) {
	userID, _ := c.Get("userID")
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.marketplaceService.UpdateItem(userID.(uint), uint(itemID), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Item updated successfully",
		"item":    item,
	})
}

func (h *MarketplaceHandler) DeleteItem(c *gin.Context) {
	userID, _ := c.Get("userID")
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	if err := h.marketplaceService.DeleteItem(userID.(uint), uint(itemID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Item deleted successfully",
	})
}

func (h *MarketplaceHandler) GetMyItems(c *gin.Context) {
	userID, _ := c.Get("userID")

	items, err := h.marketplaceService.GetUserItems(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
	})
}

func (h *MarketplaceHandler) CreateInquiry(c *gin.Context) {
	userID, _ := c.Get("userID")
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var req struct {
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inquiry, err := h.marketplaceService.CreateInquiry(userID.(uint), uint(itemID), req.Message)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Inquiry sent successfully",
		"inquiry": inquiry,
	})
}

func (h *MarketplaceHandler) GetCategories(c *gin.Context) {
	categories, err := h.marketplaceService.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
