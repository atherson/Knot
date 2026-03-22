import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await adminAPI.getAnalytics(period);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const periods = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={period === p.value ? 'gradient-orange text-white' : ''}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Active Users',
            value: analytics?.users?.active_today || 0,
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'from-blue-500 to-blue-600',
          },
          {
            title: 'New Users',
            value: analytics?.users?.new_today || 0,
            change: '+5%',
            trend: 'up',
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
          },
          {
            title: 'Posts Today',
            value: analytics?.posts?.today || 0,
            change: '-3%',
            trend: 'down',
            icon: FileText,
            color: 'from-orange-500 to-orange-600',
          },
          {
            title: 'Messages',
            value: analytics?.engagement?.messages_today || 0,
            change: '+18%',
            trend: 'up',
            icon: MessageSquare,
            color: 'from-purple-500 to-purple-600',
          },
        ].map((metric) => (
          <Card key={metric.title} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <div className={`flex items-center gap-1 text-sm mt-2 ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">User growth chart will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Engagement Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Engagement chart will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <p className="text-3xl font-bold text-orange-600">
                {analytics?.engagement?.likes_today || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Likes Today</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-600">
                {analytics?.engagement?.comments_today || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Comments Today</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-600">
                {analytics?.engagement?.messages_today || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Messages Today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
