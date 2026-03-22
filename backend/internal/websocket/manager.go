package websocket

import (
	"campusconnect/internal/services"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Manager struct {
	clients    map[uint]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
	upgrader   websocket.Upgrader
	chatService *services.ChatService
}

type Client struct {
	ID     uint
	Socket *websocket.Conn
	Send   chan []byte
	Hub    *Manager
}

type Message struct {
	Type           string      `json:"type"`
	ConversationID uint        `json:"conversation_id,omitempty"`
	Content        string      `json:"content,omitempty"`
	SenderID       uint        `json:"sender_id,omitempty"`
	ReceiverID     uint        `json:"receiver_id,omitempty"`
	Data           interface{} `json:"data,omitempty"`
	Timestamp      time.Time   `json:"timestamp"`
}

func NewManager(chatService *services.ChatService) *Manager {
	return &Manager{
		clients:    make(map[uint]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins in development
			},
		},
		chatService: chatService,
	}
}

func (m *Manager) Run() {
	for {
		select {
		case client := <-m.register:
			m.mu.Lock()
			m.clients[client.ID] = client
			m.mu.Unlock()

			// Notify others that user is online
			m.broadcastUserStatus(client.ID, "online")

		case client := <-m.unregister:
			m.mu.Lock()
			if _, ok := m.clients[client.ID]; ok {
				delete(m.clients, client.ID)
				close(client.Send)
			}
			m.mu.Unlock()

			// Notify others that user is offline
			m.broadcastUserStatus(client.ID, "offline")

		case message := <-m.broadcast:
			m.mu.RLock()
			for _, client := range m.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(m.clients, client.ID)
				}
			}
			m.mu.RUnlock()
		}
	}
}

func (m *Manager) HandleWebSocket(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	conn, err := m.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &Client{
		ID:     userID.(uint),
		Socket: conn,
		Send:   make(chan []byte, 256),
		Hub:    m,
	}

	m.register <- client

	go client.writePump()
	go client.readPump(m)
}

func (c *Client) readPump(m *Manager) {
	defer func() {
		m.unregister <- c
		c.Socket.Close()
	}()

	c.Socket.SetReadLimit(512 * 1024) // 512KB
	c.Socket.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Socket.SetPongHandler(func(string) error {
		c.Socket.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Socket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				// Log error
			}
			break
		}

		// Parse message
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		msg.SenderID = c.ID
		msg.Timestamp = time.Now()

		// Handle different message types
		switch msg.Type {
		case "message":
			m.handleChatMessage(&msg)
		case "typing":
			m.handleTypingStatus(&msg)
		case "read":
			m.handleReadReceipt(&msg)
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Socket.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Socket.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Socket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.Socket.WriteMessage(websocket.TextMessage, message)

		case <-ticker.C:
			c.Socket.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Socket.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (m *Manager) handleChatMessage(msg *Message) {
	// Save message to database
	savedMsg, err := m.chatService.SendMessage(msg.ConversationID, msg.SenderID, msg.Content, "text", "")
	if err != nil {
		return
	}

	// Broadcast to conversation participants
	response := Message{
		Type:           "message",
		ConversationID: msg.ConversationID,
		Content:        savedMsg.Content,
		SenderID:       savedMsg.SenderID,
		Data:           savedMsg,
		Timestamp:      savedMsg.CreatedAt,
	}

	data, _ := json.Marshal(response)
	m.broadcastToConversation(msg.ConversationID, data)
}

func (m *Manager) handleTypingStatus(msg *Message) {
	data, _ := json.Marshal(msg)
	m.broadcastToConversation(msg.ConversationID, data)
}

func (m *Manager) handleReadReceipt(msg *Message) {
	m.chatService.MarkMessagesAsRead(msg.ConversationID, msg.SenderID)
	data, _ := json.Marshal(msg)
	m.broadcastToConversation(msg.ConversationID, data)
}

func (m *Manager) broadcastToConversation(conversationID uint, data []byte) {
	// Get conversation participants
	// For simplicity, broadcast to all connected clients
	// In production, only send to participants
	m.mu.RLock()
	for _, client := range m.clients {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			delete(m.clients, client.ID)
		}
	}
	m.mu.RUnlock()
}

func (m *Manager) broadcastUserStatus(userID uint, status string) {
	msg := Message{
		Type:      "user_status",
		SenderID:  userID,
		Data:      map[string]string{"status": status},
		Timestamp: time.Now(),
	}
	data, _ := json.Marshal(msg)
	m.broadcast <- data
}

func (m *Manager) SendToUser(userID uint, data []byte) {
	m.mu.RLock()
	client, exists := m.clients[userID]
	m.mu.RUnlock()

	if exists {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			m.mu.Lock()
			delete(m.clients, userID)
			m.mu.Unlock()
		}
	}
}

func (m *Manager) IsUserOnline(userID uint) bool {
	m.mu.RLock()
	_, exists := m.clients[userID]
	m.mu.RUnlock()
	return exists
}
