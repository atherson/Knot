package ai

import (
	"campusconnect/internal/config"
	"campusconnect/internal/models"
	"strings"
)

type ModerationService struct {
	config *config.AIConfig
}

type ModerationResult struct {
	IsApproved   bool     `json:"is_approved"`
	Score        float64  `json:"score"`
	Categories   []string `json:"categories"`
	Reason       string   `json:"reason"`
}

// List of inappropriate words and patterns
var inappropriateWords = []string{
	"hate", "kill", "die", "stupid", "idiot", "dumb", "loser",
	"racist", "sexist", "homophobic", "discriminate", "bully",
	"harass", "threat", "violence", "abuse", "attack",
}

// Patterns for detecting potential issues
var sensitivePatterns = []string{
	"personal information",
	"phone number",
	"address",
	"credit card",
	"password",
}

func NewModerationService(cfg *config.AIConfig) *ModerationService {
	return &ModerationService{config: cfg}
}

func (m *ModerationService) ModerateContent(content string) *ModerationResult {
	if !m.config.Enabled {
		return &ModerationResult{
			IsApproved: true,
			Score:      0,
			Categories: []string{},
			Reason:     "AI moderation disabled",
		}
	}

	contentLower := strings.ToLower(content)
	score := 0.0
	categories := []string{}

	// Check for inappropriate words
	for _, word := range inappropriateWords {
		if strings.Contains(contentLower, word) {
			score += 0.3
			categories = append(categories, "inappropriate_language")
			break
		}
	}

	// Check for sensitive patterns
	for _, pattern := range sensitivePatterns {
		if strings.Contains(contentLower, pattern) {
			score += 0.2
			categories = append(categories, "personal_information")
			break
		}
	}

	// Check for excessive capitalization (shouting)
	capsCount := 0
	for _, char := range content {
		if char >= 'A' && char <= 'Z' {
			capsCount++
		}
	}
	if len(content) > 0 && float64(capsCount)/float64(len(content)) > 0.5 && len(content) > 10 {
		score += 0.1
		categories = append(categories, "excessive_capitalization")
	}

	// Check for repeated characters (spam indicator)
	for i := 0; i < len(content)-2; i++ {
		if content[i] == content[i+1] && content[i] == content[i+2] {
			score += 0.15
			categories = append(categories, "spam_pattern")
			break
		}
	}

	// Check content length
	if len(content) < 5 {
		score += 0.1
		categories = append(categories, "too_short")
	}

	isApproved := score < m.config.ModerationThreshold

	reason := "Content passed moderation"
	if !isApproved {
		reason = "Content flagged for: " + strings.Join(categories, ", ")
	}

	return &ModerationResult{
		IsApproved:   isApproved,
		Score:        score,
		Categories:   categories,
		Reason:       reason,
	}
}

func (m *ModerationService) SaveModerationResult(db interface{}, postID uint, result *ModerationResult) error {
	// This would typically save to database
	// For now, we'll just return nil
	_ = postID
	_ = result
	return nil
}

func (m *ModerationService) GetModerationSuggestion(content string) string {
	result := m.ModerateContent(content)
	
	if result.IsApproved {
		return ""
	}

	suggestions := []string{
		"Please review your content before posting.",
		"Consider rephrasing to be more respectful.",
		"Avoid using inappropriate language.",
		"Keep the conversation friendly and constructive.",
	}

	if contains(result.Categories, "personal_information") {
		suggestions = append(suggestions, "Avoid sharing personal information publicly.")
	}

	if contains(result.Categories, "excessive_capitalization") {
		suggestions = append(suggestions, "Use normal capitalization for better readability.")
	}

	return strings.Join(suggestions, " ")
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Convert to model
func (m *ModerationResult) ToModel(postID uint) *models.AIModerationResult {
	categoriesJSON := models.JSON{}
	for _, cat := range m.Categories {
		categoriesJSON[cat] = true
	}
	
	return &models.AIModerationResult{
		PostID:     postID,
		IsApproved: m.IsApproved,
		Score:      m.Score,
		Categories: categoriesJSON,
		Reason:     m.Reason,
	}
}
