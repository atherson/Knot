import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

export function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await adminAPI.getPendingPosts();
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleModerate = async (postId: number, approved: boolean) => {
    try {
      await adminAPI.moderatePost(postId, approved);
      toast.success(approved ? 'Post approved' : 'Post rejected');
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      toast.error('Failed to moderate post');
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await adminAPI.deletePost(postId);
      toast.success('Post deleted');
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <Badge className="bg-yellow-500 text-white">
          <AlertCircle className="w-4 h-4 mr-1" />
          {posts.length} Pending
        </Badge>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="border-0 shadow-md">
            <CardContent className="p-6">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {post.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{post.user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* AI Moderation Result */}
              {post.ai_result && (
                <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    AI Moderation Result
                  </p>
                  <p className="text-sm text-yellow-700">
                    Score: {(post.ai_result.score * 100).toFixed(1)}% - {post.ai_result.reason}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleModerate(post.id, true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleModerate(post.id, false)}
                  variant="outline"
                  className="text-red-600"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleDelete(post.id)}
                  variant="ghost"
                  className="text-red-600 ml-auto"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">No posts pending moderation</p>
          </div>
        )}
      </div>
    </div>
  );
}
