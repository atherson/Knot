import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '@/lib/api';
import type { Message } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScrollToBottom } from '@/hooks/useInfiniteScroll';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Send, MoreVertical, Phone, Video, Image as ImageIcon, Smile } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<{ name: string; avatar?: string; online_status?: string } | null>(null);
  const { containerRef, scrollToBottom, isAtBottom } = useScrollToBottom<HTMLDivElement>();

  const conversationId = parseInt(id || '0');

  const fetchMessages = useCallback(async () => {
    try {
      const response = await chatAPI.getMessages(conversationId, 1, 50);
      setMessages(response.data.messages.reverse());
      
      // Extract other user info from first message
      if (response.data.messages.length > 0) {
        const firstMsg = response.data.messages[0];
        const other = firstMsg.sender_id === user?.id 
          ? response.data.messages.find((m: Message) => m.sender_id !== user?.id)?.sender
          : firstMsg.sender;
        if (other) {
          setOtherUser(other);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    fetchMessages();
    chatAPI.markAsRead(conversationId);
  }, [fetchMessages, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // WebSocket for real-time messages
  const { sendMessage, isConnected } = useWebSocket(
    API_URL.replace('http', 'ws') + '/ws',
    {
      onMessage: (message) => {
        if (message.type === 'message' && message.conversation_id === conversationId) {
          setMessages((prev) => [...prev, message.data]);
          scrollToBottom('smooth');
        }
      },
    }
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const tempMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: user?.id || 0,
      sender: user as any,
      content,
      type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom('smooth');

    try {
      // Send via WebSocket if connected
      if (isConnected) {
        sendMessage({
          type: 'message',
          conversation_id: conversationId,
          content,
        });
      } else {
        // Fallback to HTTP
        await chatAPI.sendMessage(conversationId, content);
      }
    } catch (error) {
      toast.error('Failed to send message');
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <Skeleton className="h-16 rounded-2xl mb-4" />
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col page-enter">
      {/* Header */}
      <Card className="border-0 shadow-md mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chats')}
              className="lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-orange-100">
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {otherUser?.online_status === 'online' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{otherUser?.name || 'Unknown User'}</h2>
              <p className="text-xs text-gray-500">
                {otherUser?.online_status === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-2"
      >
        {messages.map((message, index) => {
          const isMe = message.sender_id === user?.id;
          const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {!isMe && showAvatar ? (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={message.sender?.avatar} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                    {message.sender?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : !isMe ? (
                <div className="w-8" />
              ) : null}

              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isMe
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-500">Send a message to get started</p>
          </div>
        )}
      </div>

      {/* Input */}
      <Card className="border-0 shadow-md mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-600">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-600">
              <Smile className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="gradient-orange text-white btn-press"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
