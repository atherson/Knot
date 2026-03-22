import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  MessageCircle,
  ShoppingBag,
  Users,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const sidebarItems = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: MessageCircle, label: 'Chats', path: '/chats' },
  { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
  { icon: Users, label: 'Groups', path: '/groups' },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: true },
];

const bottomItems = [
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { unreadCount, addNotification } = useNotifications();

  // WebSocket connection for real-time notifications
  useWebSocket(
    API_URL.replace('http', 'ws') + '/ws',
    {
      onMessage: (message) => {
        if (message.type === 'notification') {
          addNotification(message.data);
        }
      },
    }
  );

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/feed';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-green-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/80 backdrop-blur-xl border-r border-orange-100 z-40">
        {/* Logo */}
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl text-gray-800">CampusConnect</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-transform group-hover:scale-110',
                  isActive(item.path) && 'text-white'
                )} />
                <span className="font-medium">{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <Badge 
                    className={cn(
                      'ml-auto badge-pulse',
                      isActive(item.path) 
                        ? 'bg-white text-orange-600' 
                        : 'bg-orange-500 text-white'
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          <Separator className="my-4 bg-orange-100" />

          <nav className="space-y-1">
            {bottomItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}

            {user?.is_admin && (
              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  location.pathname.startsWith('/admin')
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                )}
              >
                <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Admin</span>
              </Link>
            )}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-orange-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50">
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500 truncate">{user?.department}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-b border-orange-100 z-40 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-lg text-gray-800">CampusConnect</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-gray-600"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-16 bottom-0 w-72 bg-white shadow-2xl slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isActive(item.path)
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:bg-orange-50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && unreadCount > 0 && (
                      <Badge className="ml-auto bg-red-500 text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                ))}

                <Separator className="my-4" />

                {bottomItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isActive(item.path)
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:bg-orange-50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}

                {user?.is_admin && (
                  <Link
                    to="/admin"
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      location.pathname.startsWith('/admin')
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-600 hover:bg-purple-50'
                    )}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}

                <Separator className="my-4" />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-orange-100 z-40 flex items-center justify-around px-2">
        {[
          { icon: Home, path: '/' },
          { icon: MessageCircle, path: '/chats' },
          { icon: ShoppingBag, path: '/marketplace' },
          { icon: Users, path: '/groups' },
          { icon: User, path: '/profile' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'p-3 rounded-xl transition-all',
              isActive(item.path)
                ? 'text-orange-500 bg-orange-50'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        ))}
      </nav>

      {/* Mobile Safe Area */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
