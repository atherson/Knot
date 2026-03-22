import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '@/lib/api';
import type { MarketplaceItem } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Eye, Heart, Share2, Flag, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

export function MarketplaceItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await marketplaceAPI.getItem(parseInt(id || '0'));
        setItem(response.data.item);
      } catch (error) {
        console.error('Failed to fetch item:', error);
        toast.error('Failed to load item');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleInquiry = async () => {
    if (!inquiryMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await marketplaceAPI.createInquiry(parseInt(id || '0'), inquiryMessage);
      toast.success('Inquiry sent successfully!');
      setIsInquiryOpen(false);
      setInquiryMessage('');
    } catch (error) {
      toast.error('Failed to send inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Item not found</h2>
        <Button onClick={() => navigate('/marketplace')} className="mt-4">
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/marketplace')}
        className="text-gray-600"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Images */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="aspect-square bg-gray-100">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0].url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>
          {item.images && item.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {item.images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                />
              ))}
            </div>
          )}
        </Card>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">{item.condition}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>
            <p className="text-3xl font-bold text-orange-600">
              ${item.price.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {item.views_count} views
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(item.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {item.location || 'Campus'}
            </div>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={item.user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {item.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{item.user?.name}</p>
                  <p className="text-sm text-gray-500">{item.user?.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>

          <div className="flex gap-3">
            <Button
              className="flex-1 gradient-orange text-white btn-press h-12"
              onClick={() => setIsInquiryOpen(true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Seller
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Flag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Inquiry Dialog */}
      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>
              Send a message to {item.user?.name} about "{item.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="Hi! I'm interested in this item. Is it still available?"
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsInquiryOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInquiry}
                disabled={!inquiryMessage.trim() || isSubmitting}
                className="flex-1 gradient-orange text-white"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
