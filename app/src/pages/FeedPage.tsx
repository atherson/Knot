import { useState, useEffect, useCallback } from 'react';
import { postsAPI } from '@/lib/api';
import type { Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

export function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      const response = await postsAPI.getFeed(pageNum, 10);
      const newPosts = response.data.posts;
      
      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    }
  }, []);

  useEffect(() => {
    fetchPosts(1).then(() => setIsLoading(false));
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchPosts(page + 1, true);
    setPage((p) => p + 1);
    setIsLoadingMore(false);
  }, [fetchPosts, page, isLoadingMore, hasMore]);

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
  });

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await postsAPI.createPost({
        content: newPostContent,
        images: [],
      });
      
      const newPost = response.data.post;
      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent('');
      toast.success('Post created successfully!');
    } catch (error: any) {
      if (error.response?.data?.ai_moderation) {
        toast.error('Your post needs revision. Please keep it respectful and appropriate.');
      } else {
        toast.error('Failed to create post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      if (likedPosts.has(postId)) {
        await postsAPI.unlikePost(postId);
        setLikedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p
          )
        );
      } else {
        await postsAPI.likePost(postId);
        setLikedPosts((prev) => new Set(prev).add(postId));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
          )
        );
      }
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-32 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      {/* Create Post */}
      <Card className="border-0 shadow-lg shadow-orange-500/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 border-2 border-orange-100">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-orange-600">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Photo
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isSubmitting}
                  className="gradient-orange text-white btn-press"
                  size="sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <Card
            key={post.id}
            className="border-0 shadow-lg shadow-orange-500/5 overflow-hidden card-hover"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-orange-100">
                    <AvatarImage src={post.user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                      {post.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{post.user?.name}</p>
                    <p className="text-xs text-gray-500">
                      {post.user?.department} • {formatDistanceToNow(post.created_at)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              {/* Post Content */}
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4 rounded-xl overflow-hidden">
                  {post.images.map((image) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt="Post image"
                      className="w-full h-48 object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              {/* AI Moderation Warning */}
              {post.status === 'pending' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    This post is pending review by our AI moderation system.
                  </p>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    likedPosts.has(post.id)
                      ? 'text-red-500'
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform ${
                      likedPosts.has(post.id) ? 'fill-current scale-110' : ''
                    }`}
                  />
                  {post.likes_count}
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  {post.comments_count}
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors ml-auto">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4">
            {isLoadingMore && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            )}
          </div>
        )}

        {/* End of Feed */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end of the feed</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share something with your campus!</p>
          </div>
        )}
      </div>
    </div>
  );
}
