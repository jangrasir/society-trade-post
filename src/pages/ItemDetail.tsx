import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ArrowLeft, Calendar, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/lib/security';

interface ItemDetail {
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
}

export default function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (itemId) {
      fetchItemDetail();
      if (user) {
        checkWishlistStatus();
      }
    }
  }, [itemId, user]);

  const fetchItemDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles (
            full_name,
            hostel_pg_society
          )
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load item details',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user!.id)
        .eq('item_id', itemId)
        .single();

      setIsWishlisted(!!data);
    } catch (error) {
      // Item not in wishlist
    }
  };

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
          .eq('item_id', itemId);

        if (error) throw error;
        setIsWishlisted(false);

        toast({
          title: 'Removed from wishlist',
          description: 'Item removed from your wishlist',
        });
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            item_id: itemId,
          });

        if (error) throw error;
        setIsWishlisted(true);

        toast({
          title: 'Added to wishlist',
          description: 'Item added to your wishlist',
        });
      }
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

  const handleChatClick = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to chat with sellers',
        variant: 'destructive',
      });
      return;
    }

    if (user.id === item?.seller_id) {
      toast({
        title: 'Cannot chat',
        description: 'You cannot chat with yourself',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('item_id', itemId)
        .eq('buyer_id', user.id)
        .eq('seller_id', item?.seller_id)
        .single();

      if (existingChat) {
        navigate(`/chats/${existingChat.id}`);
      } else {
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert({
            item_id: itemId,
            buyer_id: user.id,
            seller_id: item?.seller_id,
          })
          .select('id')
          .single();

        if (error) throw error;
        navigate(`/chats/${newChat.id}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  const categoryColors = {
    electronics: 'bg-blue-100 text-blue-800',
    furniture: 'bg-green-100 text-green-800',
    clothing: 'bg-purple-100 text-purple-800',
    books: 'bg-orange-100 text-orange-800',
    miscellaneous: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-6 bg-muted rounded w-24"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {item.images && item.images.length > 0 ? (
                <img
                  src={`${supabase.storage.from('item-images').getPublicUrl(item.images[currentImageIndex]).data.publicUrl}`}
                  alt={sanitizeInput(item.title)}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-muted flex items-center justify-center rounded-lg">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thumbnail Gallery */}
          {item.images && item.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {item.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                    index === currentImageIndex ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img
                    src={`${supabase.storage.from('item-images').getPublicUrl(image).data.publicUrl}`}
                    alt={`${sanitizeInput(item.title)} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{sanitizeInput(item.title)}</h1>
              <Badge 
                variant="secondary" 
                className={categoryColors[item.category as keyof typeof categoryColors]}
              >
                {item.category}
              </Badge>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-bold text-primary">₹{item.price}</span>
              {item.status === 'sold' && (
                <Badge variant="destructive">Sold</Badge>
              )}
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {sanitizeInput(item.description)}
            </p>
          </div>

          {/* Seller Information */}
          {item.profiles && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Seller Information
                </h3>
                <div className="space-y-1">
                  <p className="font-medium">{sanitizeInput(item.profiles.full_name)}</p>
                  <p className="text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {sanitizeInput(item.profiles.hostel_pg_society)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posted Date */}
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Posted on {new Date(item.created_at).toLocaleDateString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="flex-1"
            >
              <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
              {isWishlisted ? 'Saved' : 'Save to Wishlist'}
            </Button>
            
            {item.status === 'available' && user?.id !== item.seller_id && (
              <Button onClick={handleChatClick} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}