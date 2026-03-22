import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '@/lib/api';
import type { MarketplaceItem } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus, Filter, MapPin, Eye, Heart } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

const categories = ['All', 'Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Services', 'Other'];

export function MarketplacePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchItems = useCallback(async () => {
    try {
      const filters: any = {};
      if (selectedCategory !== 'All') filters.category = selectedCategory;
      if (searchQuery) filters.q = searchQuery;

      const response = await marketplaceAPI.getItems(filters, 1, 20);
      setItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load marketplace items');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-14 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <Button className="gradient-orange text-white btn-press">
          <Plus className="w-4 h-4 mr-2" />
          Sell Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white border-0 shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-12 px-6">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'gradient-orange text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="border-0 shadow-md overflow-hidden cursor-pointer card-hover group"
            onClick={() => navigate(`/marketplace/${item.id}`)}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0].url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-4xl">📦</span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle favorite
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
                >
                  <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                <Eye className="w-3 h-3" />
                {item.views_count}
              </div>
            </div>
            <CardContent className="p-3">
              <p className="font-semibold text-gray-900 truncate">{item.title}</p>
              <p className="text-lg font-bold text-orange-600">
                ${item.price.toFixed(2)}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                {item.location || 'Campus'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(item.created_at)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 mb-4">Be the first to sell something on the marketplace!</p>
          <Button className="gradient-orange text-white">
            <Plus className="w-4 h-4 mr-2" />
            Sell Item
          </Button>
        </div>
      )}
    </div>
  );
}
