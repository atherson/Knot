import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  requestOTP: (email: string) => api.post('/auth/otp/request', { email }),
  verifyOTP: (email: string, otp: string) => api.post('/auth/otp/verify', { email, otp }),
  getMe: () => api.get('/users/me'),
  updateProfile: (data: Partial<User>) => api.patch('/users/me', data),
};

// Posts API
export const postsAPI = {
  getFeed: (page = 1, limit = 20) => api.get('/feed', { params: { page, limit } }),
  createPost: (data: CreatePostData) => api.post('/posts', data),
  getPost: (id: number) => api.get(`/posts/${id}`),
  deletePost: (id: number) => api.delete(`/posts/${id}`),
  likePost: (id: number) => api.post(`/posts/${id}/like`),
  unlikePost: (id: number) => api.delete(`/posts/${id}/like`),
  createComment: (postId: number, content: string, parentId?: number) => 
    api.post(`/posts/${postId}/comments`, { content, parent_id: parentId }),
  reportPost: (id: number, reason: string, description?: string) => 
    api.post(`/posts/${id}/report`, { reason, description }),
};

// Chat API
export const chatAPI = {
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId: number, page = 1, limit = 50) => 
    api.get(`/conversations/${conversationId}/messages`, { params: { page, limit } }),
  sendMessage: (conversationId: number, content: string, type = 'text', mediaUrl = '') => 
    api.post(`/conversations/${conversationId}/messages`, { content, type, media_url: mediaUrl }),
  markAsRead: (conversationId: number) => api.post(`/conversations/${conversationId}/read`),
  startConversation: (userId: number) => api.post('/conversations', { user_id: userId }),
  blockUser: (userId: number, reason?: string) => api.post('/users/block', { user_id: userId, reason }),
  unblockUser: (userId: number) => api.post('/users/unblock', { user_id: userId }),
  getBlockedUsers: () => api.get('/users/blocked'),
};

// Groups API
export const groupsAPI = {
  getGroups: (category?: string, page = 1, limit = 20) => 
    api.get('/groups', { params: { category, page, limit } }),
  getMyGroups: () => api.get('/groups/my'),
  getGroup: (id: number) => api.get(`/groups/${id}`),
  createGroup: (data: CreateGroupData) => api.post('/groups', data),
  joinGroup: (id: number) => api.post(`/groups/${id}/join`),
  leaveGroup: (id: number) => api.post(`/groups/${id}/leave`),
  getGroupPosts: (id: number, page = 1, limit = 20) => 
    api.get(`/groups/${id}/posts`, { params: { page, limit } }),
};

// Marketplace API
export const marketplaceAPI = {
  getItems: (filters?: ItemFilters, page = 1, limit = 20) => 
    api.get('/marketplace', { params: { ...filters, page, limit } }),
  getItem: (id: number) => api.get(`/marketplace/${id}`),
  createItem: (data: CreateItemData) => api.post('/marketplace', data),
  updateItem: (id: number, data: Partial<CreateItemData>) => api.patch(`/marketplace/${id}`, data),
  deleteItem: (id: number) => api.delete(`/marketplace/${id}`),
  getMyItems: () => api.get('/marketplace/my'),
  getCategories: () => api.get('/marketplace/categories'),
  createInquiry: (itemId: number, message: string) => 
    api.post(`/marketplace/${itemId}/inquire`, { message }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (page = 1, limit = 20) => 
    api.get('/notifications', { params: { page, limit } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: NotificationPrefs) => api.patch('/notifications/preferences', data),
};

// Admin API
export const adminAPI = {
  getUsers: (search?: string, page = 1, limit = 50) => 
    api.get('/admin/users', { params: { search, page, limit } }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  suspendUser: (id: number, reason?: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
  unsuspendUser: (id: number) => api.post(`/admin/users/${id}/unsuspend`),
  getPendingPosts: (page = 1, limit = 20) => 
    api.get('/admin/posts/pending', { params: { page, limit } }),
  moderatePost: (id: number, approved: boolean) => 
    api.post(`/admin/posts/${id}/moderate`, { approved }),
  deletePost: (id: number) => api.delete(`/admin/posts/${id}`),
  getReports: (status = 'pending', page = 1, limit = 20) => 
    api.get('/admin/reports', { params: { status, page, limit } }),
  resolveReport: (id: number, action: string, reason?: string) => 
    api.post(`/admin/reports/${id}/resolve`, { action, reason }),
  getAnalytics: (period = '7d') => api.get('/admin/analytics', { params: { period } }),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
};

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  department?: string;
  course?: string;
  year_of_study?: number;
  online_status?: string;
  last_active_at?: string;
  created_at?: string;
  is_admin?: boolean;
}

export interface Post {
  id: number;
  user_id: number;
  user?: User;
  content: string;
  images?: PostImage[];
  status: string;
  likes_count: number;
  comments_count: number;
  is_anonymous: boolean;
  group_id?: number;
  created_at: string;
  comments?: Comment[];
}

export interface PostImage {
  id: number;
  url: string;
  order: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  user?: User;
  content: string;
  parent_id?: number;
  replies?: Comment[];
  created_at: string;
}

export interface Conversation {
  id: number;
  participant1_id: number;
  participant2_id: number;
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender?: User;
  content: string;
  type: string;
  media_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  type: string;
  category?: string;
  created_by: number;
  creator?: User;
  members_count: number;
  posts_count: number;
  members?: GroupMember[];
  created_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  user?: User;
  role: string;
  joined_at: string;
}

export interface MarketplaceItem {
  id: number;
  user_id: number;
  user?: User;
  title: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  condition?: string;
  images?: ItemImage[];
  status: string;
  course?: string;
  department?: string;
  location?: string;
  views_count: number;
  created_at: string;
}

export interface ItemImage {
  id: number;
  url: string;
  order: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title?: string;
  content?: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  actor?: User;
  target_type?: string;
  target_id?: number;
  created_at: string;
}

export interface CreatePostData {
  content: string;
  images?: string[];
  is_anonymous?: boolean;
  group_id?: number;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  category?: string;
  type?: string;
}

export interface CreateItemData {
  title: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  condition?: string;
  images?: string[];
  course?: string;
  department?: string;
  location?: string;
}

export interface ItemFilters {
  category?: string;
  course?: string;
  department?: string;
  min_price?: number;
  max_price?: number;
  q?: string;
}

export interface NotificationPrefs {
  email_likes?: boolean;
  email_comments?: boolean;
  email_messages?: boolean;
  email_groups?: boolean;
  push_likes?: boolean;
  push_comments?: boolean;
  push_messages?: boolean;
  push_groups?: boolean;
}

export default api;
