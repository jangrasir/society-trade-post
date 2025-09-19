import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemCard } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const categories = [
  { id: 'all', name: 'All', icon: '🛍️' },
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'furniture', name: 'Furniture', icon: '🪑' },
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'miscellaneous', name: 'Miscellaneous', icon: '📦' },
];

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
    if (user) {
      fetchWishlists();
    }
  }, [selectedCategory, user]);

  const fetchItems = async () => {
    setLoading(true);
    
    let query = supabase
      .from('items')
      .select(`
        *,
        profiles (
          full_name,
          hostel_pg_society
        )
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as any);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const fetchWishlists = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('wishlists')
      .select('item_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setWishlistedItems(new Set(data.map(w => w.item_id)));
    }
  };

  const handleChatClick = async (itemId: string, sellerId: string) => {
    if (!user) return;

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to SocietyMart
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
            Your exclusive marketplace for PG, hostel & society members
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg" variant="secondary">
                <a href="#marketplace">Browse Items</a>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" variant="secondary">
                  <a href="/auth">Get Started</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-primary border-white hover:bg-white">
                  <a href="#features">Learn More</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SocietyMart?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Trusted</h3>
              <p className="text-muted-foreground">
                Verified users from your community ensure safe transactions
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
              <p className="text-muted-foreground">
                Connect instantly with buyers and sellers in your area
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-muted-foreground">
                Simple interface designed for quick buying and selling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Marketplace</h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isWishlisted={wishlistedItems.has(item.id)}
                  onWishlistChange={fetchWishlists}
                  onChatClick={handleChatClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {selectedCategory === 'all' 
                  ? 'No items available at the moment' 
                  : `No ${selectedCategory} items available`
                }
              </p>
              {user && (
                <Button asChild className="mt-4">
                  <a href="/sell">List Your First Item</a>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}