package main

import (
	"campusconnect/internal/config"
	"campusconnect/internal/handlers"
	"campusconnect/internal/middleware"
	"campusconnect/internal/repository"
	"campusconnect/internal/services"
	"campusconnect/internal/websocket"
	"campusconnect/pkg/ai"
	"campusconnect/pkg/auth"
	"campusconnect/pkg/email"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := repository.NewDatabase(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := db.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Redis
	redis, err := repository.NewRedisClient(&cfg.Redis)
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
		// Continue without Redis
	}

	// Initialize services
	jwtManager := auth.NewJWTManager(&cfg.JWT)
	
	var emailService *email.EmailService
	if cfg.Email.SendGridAPIKey != "" {
		emailService = email.NewEmailService(&cfg.Email)
	}

	aiService := ai.NewModerationService(&cfg.AI)

	// Initialize repositories and services
	userService := services.NewUserService(db.DB, redis, emailService, jwtManager)
	postService := services.NewPostService(db.DB, redis, aiService)
	chatService := services.NewChatService(db.DB, redis)
	groupService := services.NewGroupService(db.DB, redis)
	marketplaceService := services.NewMarketplaceService(db.DB, redis)
	notificationService := services.NewNotificationService(db.DB, redis)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService)
	postHandler := handlers.NewPostHandler(postService)
	chatHandler := handlers.NewChatHandler(chatService)
	groupHandler := handlers.NewGroupHandler(groupService)
	marketplaceHandler := handlers.NewMarketplaceHandler(marketplaceService)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	adminHandler := handlers.NewAdminHandler(userService, postService, groupService, marketplaceService, notificationService)

	// Initialize WebSocket manager
	wsManager := websocket.NewManager(chatService)
	go wsManager.Run()

	// Setup router
	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CORSMiddleware(cfg.Server.AllowOrigins))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"service": "campusconnect-api",
		})
	})

	// Public routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/otp/request", authHandler.RequestOTP)
			auth.POST("/otp/verify", authHandler.VerifyOTP)
		}
	}

	// Protected routes
	authorized := api.Group("/")
	authorized.Use(middleware.AuthMiddleware(jwtManager))
	{
		// User routes
		authorized.GET("/users/me", authHandler.GetMe)
		authorized.PATCH("/users/me", authHandler.UpdateProfile)

		// Post routes
		authorized.GET("/feed", postHandler.GetFeed)
		authorized.POST("/posts", postHandler.CreatePost)
		authorized.GET("/posts/:id", postHandler.GetPost)
		authorized.DELETE("/posts/:id", postHandler.DeletePost)
		authorized.POST("/posts/:id/like", postHandler.LikePost)
		authorized.DELETE("/posts/:id/like", postHandler.UnlikePost)
		authorized.POST("/posts/:id/comments", postHandler.CreateComment)
		authorized.POST("/posts/:id/report", postHandler.ReportPost)

		// Chat routes
		authorized.GET("/conversations", chatHandler.GetConversations)
		authorized.POST("/conversations", chatHandler.StartConversation)
		authorized.GET("/conversations/:id/messages", chatHandler.GetMessages)
		authorized.POST("/conversations/:id/messages", chatHandler.SendMessage)
		authorized.POST("/conversations/:id/read", chatHandler.MarkAsRead)
		authorized.POST("/users/block", chatHandler.BlockUser)
		authorized.POST("/users/unblock", chatHandler.UnblockUser)
		authorized.GET("/users/blocked", chatHandler.GetBlockedUsers)

		// Group routes
		authorized.GET("/groups", groupHandler.GetGroups)
		authorized.POST("/groups", groupHandler.CreateGroup)
		authorized.GET("/groups/my", groupHandler.GetMyGroups)
		authorized.GET("/groups/:id", groupHandler.GetGroup)
		authorized.POST("/groups/:id/join", groupHandler.JoinGroup)
		authorized.POST("/groups/:id/leave", groupHandler.LeaveGroup)
		authorized.GET("/groups/:id/posts", groupHandler.GetGroupPosts)

		// Marketplace routes
		authorized.GET("/marketplace", marketplaceHandler.GetItems)
		authorized.POST("/marketplace", marketplaceHandler.CreateItem)
		authorized.GET("/marketplace/categories", marketplaceHandler.GetCategories)
		authorized.GET("/marketplace/my", marketplaceHandler.GetMyItems)
		authorized.GET("/marketplace/:id", marketplaceHandler.GetItem)
		authorized.PATCH("/marketplace/:id", marketplaceHandler.UpdateItem)
		authorized.DELETE("/marketplace/:id", marketplaceHandler.DeleteItem)
		authorized.POST("/marketplace/:id/inquire", marketplaceHandler.CreateInquiry)

		// Notification routes
		authorized.GET("/notifications", notificationHandler.GetNotifications)
		authorized.GET("/notifications/unread-count", notificationHandler.GetUnreadCount)
		authorized.POST("/notifications/:id/read", notificationHandler.MarkAsRead)
		authorized.POST("/notifications/read-all", notificationHandler.MarkAllAsRead)
		authorized.DELETE("/notifications/:id", notificationHandler.DeleteNotification)
		authorized.GET("/notifications/preferences", notificationHandler.GetPreferences)
		authorized.PATCH("/notifications/preferences", notificationHandler.UpdatePreferences)

		// WebSocket route
		authorized.GET("/ws", func(c *gin.Context) {
			wsManager.HandleWebSocket(c)
		})
	}

	// Admin routes
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(jwtManager))
	admin.Use(middleware.AdminMiddleware())
	{
		// User management
		admin.GET("/users", adminHandler.GetUsers)
		admin.GET("/users/:id", adminHandler.GetUser)
		admin.POST("/users/:id/suspend", adminHandler.SuspendUser)
		admin.POST("/users/:id/unsuspend", adminHandler.UnsuspendUser)

		// Content moderation
		admin.GET("/posts/pending", adminHandler.GetPendingPosts)
		admin.POST("/posts/:id/moderate", adminHandler.ModeratePost)
		admin.DELETE("/posts/:id", adminHandler.DeletePost)

		// Reports
		admin.GET("/reports", adminHandler.GetReports)
		admin.POST("/reports/:id/resolve", adminHandler.ResolveReport)

		// Analytics
		admin.GET("/analytics", adminHandler.GetAnalytics)
		admin.GET("/dashboard/stats", adminHandler.GetDashboardStats)
	}

	// Start server
	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
