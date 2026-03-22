import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  BarChart3,
  ArrowLeft,
  LogOut,
  Shield,
} from 'lucide-react';

const adminItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: FileText, label: 'Posts', path: '/admin/posts' },
  { icon: Flag, label: 'Reports', path: '/admin/reports' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-orange-50/20">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 flex-col bg-white/90 backdrop-blur-xl border-r border-purple-100 z-40 hidden lg:flex">
        {/* Logo */}
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-gray-800">Admin</span>
              <span className="text-xs text-purple-600 block">CampusConnect</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1">
            {adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                )}
              >
                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <Separator className="my-4 bg-purple-100" />

          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </Link>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-purple-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50">
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-purple-600 truncate">Administrator</p>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-b border-purple-100 z-40 px-4 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-800">Admin</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
