import { useNotifications } from '@/hooks/useNotifications';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Users, 
  CheckCheck, 
  Trash2,
  Bell,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

const notificationIcons: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  group_invite: Users,
  message: MessageCircle,
  group_post: Users,
  default: Bell,
};

const notificationColors: Record<string, string> = {
  like: 'text-red-500 bg-red-50',
  comment: 'text-blue-500 bg-blue-50',
  follow: 'text-green-500 bg-green-50',
  group_invite: 'text-purple-500 bg-purple-50',
  message: 'text-orange-500 bg-orange-50',
  group_post: 'text-teal-500 bg-teal-50',
  default: 'text-gray-500 bg-gray-50',
};

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: () => fetchNotifications(),
    hasMore,
    isLoading,
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-14 rounded-2xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-orange-500 text-white badge-pulse">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleMarkAllRead}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type] || notificationIcons.default;
          const colorClass = notificationColors[notification.type] || notificationColors.default;

          return (
            <Card
              key={notification.id}
              className={`border-0 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                !notification.is_read ? 'bg-orange-50/50' : ''
              }`}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Actor Avatar or Icon */}
                  {notification.actor ? (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notification.actor.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                        {notification.actor.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-800">
                          {notification.title && (
                            <span className="font-semibold">{notification.title}</span>
                          )}
                          {notification.content && (
                            <span className="text-gray-600"> {notification.content}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(notification.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4">
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
