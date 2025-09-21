import { useState } from 'react';
import { Heart, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    status: string;
    images: string[];
    created_at: string;
    seller_id: string;
    profiles?: {
      full_name: string;
      hostel_pg_society: string;
    };
  };
  isWishlisted?: boolean;
  onWishlistChange?: () => void;
  onChatClick?: (itemId: string, sellerId: string) => void;
}

export function ItemCard({ item, isWishlisted = false, onWishlistChange, onChatClick }: ItemCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlistToggle = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to wishlist',
        variant: 'destructive',
      });
      return;
    }

    setWishlistLoading(true);

    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', item.id);

        if (error) throw error;

        toast({
          title: 'Removed from wishlist',
          description: 'Item removed from your wishlist',
        });
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            item_id: item.id,
          });

        if (error) throw error;

        toast({
          title: 'Added to wishlist',
          description: 'Item added to your wishlist',
        });
      }

      onWishlistChange?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleChatClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to chat with sellers',
        variant: 'destructive',
      });
      return;
    }

    if (user.id === item.seller_id) {
      toast({
        title: 'Cannot chat',
        description: 'You cannot chat with yourself',
        variant: 'destructive',
      });
      return;
    }

    onChatClick?.(item.id, item.seller_id);
  };

  const categoryColors = {
    electronics: 'bg-blue-100 text-blue-800',
    furniture: 'bg-green-100 text-green-800',
    clothing: 'bg-purple-100 text-purple-800',
    books: 'bg-orange-100 text-orange-800',
    miscellaneous: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0">
        <div 
          className="cursor-pointer" 
          onClick={() => navigate(`/item/${item.id}`)}
        >
          {item.images && item.images.length > 0 ? (
            <img
              src={`${supabase.storage.from('item-images').getPublicUrl(item.images[0]).data.publicUrl}`}
              alt={item.title}
              className="w-full h-48 object-cover rounded-t-lg hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg hover:bg-muted/80 transition-colors">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
            <Badge 
              variant="secondary" 
              className={categoryColors[item.category as keyof typeof categoryColors]}
            >
              {item.category}
            </Badge>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-primary">₹{item.price}</span>
            {item.status === 'sold' && (
              <Badge variant="destructive">Sold</Badge>
            )}
          </div>

          {item.profiles && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{item.profiles.full_name}</p>
              <p>{item.profiles.hostel_pg_society}</p>
            </div>
          )}

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className="flex-1"
          >
            <Heart className={`h-4 w-4 mr-1 ${isWishlisted ? 'fill-current' : ''}`} />
            {isWishlisted ? 'Saved' : 'Save'}
          </Button>
          
          {item.status === 'available' && user?.id !== item.seller_id && (
            <Button
              size="sm"
              onClick={handleChatClick}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}