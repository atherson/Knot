import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '@/lib/api';
import type { Conversation } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, MessageSquare, Plus, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

export function ChatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.participant1_id === user?.id) {
      return conversation.last_message?.sender;
    }
    return conversation.last_message?.sender;
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherParticipant(conv);
    if (!otherUser) return true;
    return otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <Button className="gradient-orange text-white btn-press">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 bg-white border-0 shadow-sm"
        />
      </div>

      {/* Conversations List */}
      <div className="space-y-2">
        {filteredConversations.map((conversation) => {
          const otherUser = conversation.last_message?.sender;
          const isUnread = conversation.last_message && !conversation.last_message.is_read && 
                          conversation.last_message.sender_id !== user?.id;

          return (
            <Card
              key={conversation.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer card-hover"
              onClick={() => navigate(`/chats/${conversation.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-orange-100">
                      <AvatarImage src={otherUser?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                        {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {otherUser?.online_status === 'online' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {otherUser?.name || 'Unknown User'}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conversation.last_message ? (
                        conversation.last_message.sender_id === user?.id ? (
                          <span className="text-gray-400">You: {conversation.last_message.content}</span>
                        ) : (
                          conversation.last_message.content
                        )
                      ) : (
                        <span className="text-gray-400 italic">No messages yet</span>
                      )}
                    </p>
                  </div>

                  {isUnread && (
                    <Badge className="bg-orange-500 text-white badge-pulse">
                      New
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start a conversation with someone from your campus'}
            </p>
            {!searchQuery && (
              <Button className="gradient-orange text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Find People
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
