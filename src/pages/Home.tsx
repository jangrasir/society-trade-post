import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemCard } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
  const [featuredItem, setFeaturedItem] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
    if (user) {
      fetchWishlists();
    }
  }, [selectedCategory, user]);

  useEffect(() => {
    if (items.length > 0 && !featuredItem) {
      setFeaturedItem(items[0]);
    }
  }, [items]);

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

  const getCategoryItems = (categoryId: string) => {
    if (categoryId === 'all') return items;
    return items.filter(item => item.category === categoryId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Netflix-style Featured Hero Section */}
      {featuredItem && (
        <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0">
            {featuredItem.images && featuredItem.images.length > 0 ? (
              <img
                src={`${supabase.storage.from('item-images').getPublicUrl(featuredItem.images[0]).data.publicUrl}`}
                alt={featuredItem.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full gradient-hero" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl space-y-4 animate-fade-in-up">
                <Badge variant="secondary" className="mb-2">Featured Item</Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground drop-shadow-lg">
                  {featuredItem.title}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground line-clamp-3 drop-shadow-md">
                  {featuredItem.description}
                </p>
                <div className="flex items-center gap-4 text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ₹{featuredItem.price}
                  </span>
                  {featuredItem.profiles && (
                    <span className="text-sm text-muted-foreground font-normal">
                      by {featuredItem.profiles.full_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    size="lg" 
                    variant="premium"
                    onClick={() => navigate(`/item/${featuredItem.id}`)}
                    className="gap-2"
                  >
                    <Info className="h-5 w-5" />
                    View Details
                  </Button>
                  {user && user.id !== featuredItem.seller_id && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => handleChatClick(featuredItem.id, featuredItem.seller_id)}
                      className="gap-2 bg-background/50 backdrop-blur-sm"
                    >
                      <Play className="h-5 w-5" />
                      Chat Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4 animate-fade-in">Why Choose SocietyMart?</h2>
          <p className="text-center text-muted-foreground mb-12 animate-fade-in">Experience the future of community commerce</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-card hover-lift group">
              <div className="text-5xl mb-4 transition-transform group-hover:scale-110">🔒</div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">Secure & Trusted</h3>
              <p className="text-muted-foreground">
                Verified users from your community ensure safe transactions
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-card hover-lift group">
              <div className="text-5xl mb-4 transition-transform group-hover:scale-110">💬</div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">Real-time Chat</h3>
              <p className="text-muted-foreground">
                Connect instantly with buyers and sellers in your area
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-card hover-lift group">
              <div className="text-5xl mb-4 transition-transform group-hover:scale-110">📱</div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">Easy to Use</h3>
              <p className="text-muted-foreground">
                Simple interface designed for quick buying and selling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Netflix-style Category Carousels */}
      <section id="marketplace" className="py-12 space-y-12">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="min-w-[280px] h-[400px] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* All Items Section */}
            {items.length > 0 && (
              <div className="space-y-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Trending Now</h2>
                  <p className="text-muted-foreground mb-6">Popular items in your community</p>
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 px-4 sm:px-6 lg:px-8 pb-4">
                    {items.slice(0, 10).map((item, index) => (
                      <div 
                        key={item.id} 
                        className="min-w-[280px] animate-fade-in"
                        style={{animationDelay: `${index * 0.05}s`}}
                      >
                        <ItemCard
                          item={item}
                          isWishlisted={wishlistedItems.has(item.id)}
                          onWishlistChange={fetchWishlists}
                          onChatClick={handleChatClick}
                        />
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Category-wise Sections */}
            {categories.filter(cat => cat.id !== 'all').map((category) => {
              const categoryItems = getCategoryItems(category.id);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id} className="space-y-6">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                      <span className="text-3xl">{category.icon}</span>
                      {category.name}
                    </h2>
                    <p className="text-muted-foreground">Browse {category.name.toLowerCase()} from your neighbors</p>
                  </div>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 px-4 sm:px-6 lg:px-8 pb-4">
                      {categoryItems.slice(0, 10).map((item, index) => (
                        <div 
                          key={item.id} 
                          className="min-w-[280px] animate-fade-in"
                          style={{animationDelay: `${index * 0.05}s`}}
                        >
                          <ItemCard
                            item={item}
                            isWishlisted={wishlistedItems.has(item.id)}
                            onWishlistChange={fetchWishlists}
                            onChatClick={handleChatClick}
                          />
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              );
            })}

            {/* Empty State */}
            {items.length === 0 && (
              <div className="text-center py-20 max-w-7xl mx-auto px-4">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold mb-2">No Items Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to list an item in your community!
                </p>
                {user && (
                  <Button asChild size="lg" variant="premium">
                    <a href="/sell">List Your First Item</a>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}