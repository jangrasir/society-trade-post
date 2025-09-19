import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ItemCard } from '@/components/ItemCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        item_id,
        items (
          *,
          profiles (
            full_name,
            hostel_pg_society
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch wishlist',
        variant: 'destructive',
      });
    } else {
      const items = data?.map(w => w.items).filter(Boolean) || [];
      setWishlistItems(items);
      setWishlistedIds(new Set(data?.map(w => w.item_id) || []));
    }

    setLoading(false);
  };

  const handleChatClick = async (itemId: string, sellerId: string) => {
    try {
      // Check if chat already exists
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('item_id', itemId)
        .eq('buyer_id', user.id)
        .single();

      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError;
      }

      let chatId = existingChat?.id;

      if (!chatId) {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            item_id: itemId,
            buyer_id: user.id,
            seller_id: sellerId,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        chatId = newChat.id;
      }

      navigate(`/chats/${chatId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">My Wishlist</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isWishlisted={true}
                onWishlistChange={fetchWishlist}
                onChatClick={handleChatClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding items you like to your wishlist
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
            >
              Browse Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
}