import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI } from '@/lib/api';
import type { Group, Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Users, FileText, MessageSquare, Settings, UserPlus, LogOut } from 'lucide-react';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const groupId = parseInt(id || '0');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, postsResponse] = await Promise.all([
          groupsAPI.getGroup(groupId),
          groupsAPI.getGroupPosts(groupId, 1, 20),
        ]);
        
        const groupData = groupResponse.data.group;
        setGroup(groupData);
        setPosts(postsResponse.data.posts);
        
        // Check membership
        const member = groupData.members?.find((m: any) => m.user_id === user?.id);
        setIsMember(!!member);
        setIsAdmin(member?.role === 'admin');
      } catch (error) {
        console.error('Failed to fetch group:', error);
        toast.error('Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId, user?.id]);

  const handleJoin = async () => {
    try {
      await groupsAPI.joinGroup(groupId);
      toast.success('Joined group successfully!');
      setIsMember(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeave = async () => {
    try {
      await groupsAPI.leaveGroup(groupId);
      toast.success('Left group successfully');
      setIsMember(false);
      setIsAdmin(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to leave group');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Group not found</h2>
        <Button onClick={() => navigate('/groups')} className="mt-4">
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/groups')}
        className="text-gray-600"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Groups
      </Button>

      {/* Group Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-100 to-green-100" />
        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src={group.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-3xl">
                {group.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary">{group.category}</Badge>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.members_count} members
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {group.posts_count} posts
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!isMember ? (
                <Button onClick={handleJoin} className="gradient-orange text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
              ) : (
                <>
                  {isAdmin && (
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleLeave}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="mt-4 text-gray-600">{group.description}</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">
            <FileText className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="about">
            <MessageSquare className="w-4 h-4 mr-2" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {isMember ? (
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user?.avatar} />
                          <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
                            {post.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{post.user?.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-800">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No posts yet. Be the first to share!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Join this group to see posts</p>
              <Button onClick={handleJoin} className="mt-4 gradient-orange text-white">
                Join Group
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {group.members?.map((member: any) => (
              <Card key={member.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.user?.name}</p>
                      <p className="text-xs text-gray-500">{member.user?.department}</p>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About this group</h3>
                <p className="text-gray-600">{group.description || 'No description available.'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Created by</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={group.creator?.avatar} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {group.creator?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-600">{group.creator?.name}</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{group.members_count}</p>
                    <p className="text-sm text-gray-600">Members</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{group.posts_count}</p>
                    <p className="text-sm text-gray-600">Posts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
