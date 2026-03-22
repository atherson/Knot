import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  Flag,
  TrendingUp,
  Activity,
  MessageSquare,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Posts',
      value: stats?.total_posts || 0,
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Pending Posts',
      value: stats?.pending_posts || 0,
      icon: Activity,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Total Groups',
      value: stats?.total_groups || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Marketplace Items',
      value: stats?.marketplace_items || 0,
      icon: ShoppingBag,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Reports',
      value: stats?.reports || 0,
      icon: Flag,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Messages Today',
      value: '156',
      icon: MessageSquare,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border-0 shadow-md card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 bg-gradient-to-br ${card.color} bg-clip-text text-transparent`} 
                    style={{ color: 'inherit' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New user registered', time: '2 minutes ago', type: 'user' },
                { action: 'Post flagged for review', time: '5 minutes ago', type: 'flag' },
                { action: 'New group created', time: '15 minutes ago', type: 'group' },
                { action: 'Marketplace item posted', time: '30 minutes ago', type: 'marketplace' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'user' ? 'bg-green-500' :
                    activity.type === 'flag' ? 'bg-red-500' :
                    activity.type === 'group' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { service: 'API Server', status: 'Operational', healthy: true },
                { service: 'Database', status: 'Operational', healthy: true },
                { service: 'Redis Cache', status: 'Operational', healthy: true },
                { service: 'WebSocket', status: 'Operational', healthy: true },
              ].map((service) => (
                <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{service.service}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${service.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
