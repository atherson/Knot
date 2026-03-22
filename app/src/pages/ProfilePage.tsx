import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Heart,
  MessageCircle,
  Edit,
  Settings,
  Shield,
} from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authAPI.getMe();
        setStats(response.data.stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-100 to-green-100" />
        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-4xl">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Anonymous'}</h1>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {user?.department && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {user.department}
                  </Badge>
                )}
                {user?.course && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {user.course}
                  </Badge>
                )}
                {user?.year_of_study && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Year {user.year_of_study}
                  </Badge>
                )}
                {user?.is_admin && (
                  <Badge className="bg-purple-500 text-white flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bio */}
          {user?.bio && (
            <p className="mt-4 text-gray-600">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">{stats?.posts_count || 0}</p>
              <p className="text-sm text-gray-600">Posts</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <p className="text-2xl font-bold text-pink-600">{stats?.likes_count || 0}</p>
              <p className="text-sm text-gray-600">Likes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats?.comments_count || 0}</p>
              <p className="text-sm text-gray-600">Comments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">
            <FileText className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="likes">
            <Heart className="w-4 h-4 mr-2" />
            Likes
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageCircle className="w-4 h-4 mr-2" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Posts</h3>
              <p className="text-gray-500">Posts you've shared will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Liked Posts</h3>
              <p className="text-gray-500">Posts you've liked will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Comments</h3>
              <p className="text-gray-500">Comments you've made will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
