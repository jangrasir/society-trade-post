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
    <div className="min-h-screen bg-background gradient-mesh scroll-smooth">
      {/* Netflix-style Featured Hero Section */}
      {featuredItem && (
        <section className="relative h-[75vh] md:h-[85vh] overflow-hidden">
          {/* Background Image with Advanced Gradient Overlay */}
          <div className="absolute inset-0">
            {featuredItem.images && featuredItem.images.length > 0 ? (
              <img
                src={`${supabase.storage.from('item-images').getPublicUrl(featuredItem.images[0]).data.publicUrl}`}
                alt={featuredItem.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full gradient-hero animate-shimmer" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl space-y-6 animate-fade-in-up">
                <Badge variant="secondary" className="mb-2 shadow-glow animate-pulse-glow backdrop-blur-sm">
                  ✨ Featured Item
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-2xl animate-scale-in">
                  {featuredItem.title}
                </h1>
                <p className="text-lg md:text-2xl text-muted-foreground/90 line-clamp-3 drop-shadow-lg leading-relaxed">
                  {featuredItem.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-3xl md:text-4xl font-bold text-gradient animate-glow">
                    ₹{featuredItem.price}
                  </span>
                  {featuredItem.profiles && (
                    <span className="text-base text-muted-foreground/80 font-medium">
                      by {featuredItem.profiles.full_name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 pt-6">
                  <Button 
                    size="lg" 
                    variant="premium"
                    onClick={() => navigate(`/item/${featuredItem.id}`)}
                    className="gap-2 text-lg px-8 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
                  >
                    <Info className="h-5 w-5" />
                    View Details
                  </Button>
                  {user && user.id !== featuredItem.seller_id && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => handleChatClick(featuredItem.id, featuredItem.seller_id)}
                      className="gap-2 text-lg px-8 glass-effect hover:bg-primary/10 transition-all"
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
      <section id="features" className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient animate-fade-in">
              Why Choose SocietyMart?
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in max-w-2xl mx-auto">
              Experience the future of community commerce with cutting-edge features
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-10 rounded-2xl bg-card shadow-card hover-lift group border border-border/50 transition-all duration-500">
              <div className="text-6xl mb-6 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 animate-bounce-subtle">🔒</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-gradient transition-all">Secure & Trusted</h3>
              <p className="text-muted-foreground leading-relaxed">
                Verified users from your community ensure safe and reliable transactions every time
              </p>
            </div>
            
            <div className="text-center p-10 rounded-2xl bg-card shadow-card hover-lift group border border-border/50 transition-all duration-500" style={{animationDelay: '0.1s'}}>
              <div className="text-6xl mb-6 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 animate-bounce-subtle" style={{animationDelay: '0.5s'}}>💬</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-gradient transition-all">Real-time Chat</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect instantly with buyers and sellers through our seamless messaging system
              </p>
            </div>
            
            <div className="text-center p-10 rounded-2xl bg-card shadow-card hover-lift group border border-border/50 transition-all duration-500" style={{animationDelay: '0.2s'}}>
              <div className="text-6xl mb-6 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 animate-bounce-subtle" style={{animationDelay: '1s'}}>📱</div>
              <h3 className="text-2xl font-bold mb-4 group-hover:text-gradient transition-all">Easy to Use</h3>
              <p className="text-muted-foreground leading-relaxed">
                Intuitive interface designed for effortless browsing, listing, and purchasing
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
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gradient">Trending Now</h2>
                  <p className="text-lg text-muted-foreground mb-6">Popular items in your community</p>
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
                    <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                      <span className="text-4xl animate-bounce-subtle">{category.icon}</span>
                      <span className="text-gradient">{category.name}</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">Browse {category.name.toLowerCase()} from your neighbors</p>
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
              <div className="text-center py-32 max-w-3xl mx-auto px-4">
                <div className="text-8xl mb-8 animate-bounce-subtle">📦</div>
                <h3 className="text-4xl font-bold mb-4 text-gradient">No Items Yet</h3>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                  Be the first to list an item in your community and start the marketplace revolution!
                </p>
                {user && (
                  <Button asChild size="lg" variant="premium" className="text-lg px-10 py-6 shadow-xl shadow-primary/30">
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