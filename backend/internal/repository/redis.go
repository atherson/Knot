package repository

import (
	"campusconnect/internal/config"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisClient(cfg *config.RedisConfig) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &RedisClient{
		client: client,
		ctx:    ctx,
	}, nil
}

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(r.ctx, key, value, expiration).Err()
}

func (r *RedisClient) Get(key string) (string, error) {
	return r.client.Get(r.ctx, key).Result()
}

func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

func (r *RedisClient) SetJSON(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(r.ctx, key, data, expiration).Err()
}

func (r *RedisClient) GetJSON(key string, dest interface{}) error {
	data, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(data), dest)
}

func (r *RedisClient) Increment(key string) (int64, error) {
	return r.client.Incr(r.ctx, key).Result()
}

func (r *RedisClient) Expire(key string, expiration time.Duration) error {
	return r.client.Expire(r.ctx, key, expiration).Err()
}

func (r *RedisClient) Exists(keys ...string) (int64, error) {
	return r.client.Exists(r.ctx, keys...).Result()
}

// Session management
func (r *RedisClient) SetSession(sessionID string, userID uint, expiration time.Duration) error {
	return r.Set(fmt.Sprintf("session:%s", sessionID), userID, expiration)
}

func (r *RedisClient) GetSession(sessionID string) (uint, error) {
	var userID uint
	data, err := r.Get(fmt.Sprintf("session:%s", sessionID))
	if err != nil {
		return 0, err
	}
	_, err = fmt.Sscanf(data, "%d", &userID)
	return userID, err
}

func (r *RedisClient) DeleteSession(sessionID string) error {
	return r.Delete(fmt.Sprintf("session:%s", sessionID))
}

// Feed caching
func (r *RedisClient) CacheFeed(userID uint, posts interface{}, expiration time.Duration) error {
	key := fmt.Sprintf("feed:%d", userID)
	return r.SetJSON(key, posts, expiration)
}

func (r *RedisClient) GetCachedFeed(userID uint, dest interface{}) error {
	key := fmt.Sprintf("feed:%d", userID)
	return r.GetJSON(key, dest)
}

func (r *RedisClient) InvalidateFeed(userID uint) error {
	key := fmt.Sprintf("feed:%d", userID)
	return r.Delete(key)
}

// Online status
func (r *RedisClient) SetUserOnline(userID uint, expiration time.Duration) error {
	key := fmt.Sprintf("online:%d", userID)
	return r.Set(key, "1", expiration)
}

func (r *RedisClient) SetUserOffline(userID uint) error {
	key := fmt.Sprintf("online:%d", userID)
	return r.Delete(key)
}

func (r *RedisClient) IsUserOnline(userID uint) (bool, error) {
	key := fmt.Sprintf("online:%d", userID)
	exists, err := r.Exists(key)
	return exists > 0, err
}

// Rate limiting
func (r *RedisClient) RateLimit(key string, limit int, window time.Duration) (bool, error) {
	pipe := r.client.Pipeline()
	incr := pipe.Incr(r.ctx, key)
	pipe.Expire(r.ctx, key, window)
	_, err := pipe.Exec(r.ctx)
	if err != nil {
		return false, err
	}
	return incr.Val() <= int64(limit), nil
}

// Notifications
func (r *RedisClient) CacheNotificationCount(userID uint, count int) error {
	key := fmt.Sprintf("notif_count:%d", userID)
	return r.Set(key, count, time.Hour)
}

func (r *RedisClient) GetCachedNotificationCount(userID uint) (int, error) {
	key := fmt.Sprintf("notif_count:%d", userID)
	data, err := r.Get(key)
	if err != nil {
		return 0, err
	}
	var count int
	_, err = fmt.Sscanf(data, "%d", &count)
	return count, err
}
