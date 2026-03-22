import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { FeedPage } from '@/pages/FeedPage';
import { ChatsPage } from '@/pages/ChatsPage';
import { ChatDetailPage } from '@/pages/ChatDetailPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { MarketplaceItemPage } from '@/pages/MarketplaceItemPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { GroupDetailPage } from '@/pages/GroupDetailPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminPostsPage } from '@/pages/admin/AdminPostsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-orange-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// App Routes
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Main App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeedPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="chats/:id" element={<ChatDetailPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="marketplace/:id" element={<MarketplaceItemPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Mobile Routes */}
      <Route
        path="/m/*"
        element={
          <ProtectedRoute>
            <MobileLayout />
          </ProtectedRoute>
        }
      >
        <Route path="feed" element={<FeedPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="posts" element={<AdminPostsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
