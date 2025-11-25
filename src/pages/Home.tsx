import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemCard } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Play, Info, Sparkles, Zap, Shield, Users, TrendingUp, ShoppingBag } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Hero3DScene } from '@/components/Hero3DScene';

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
      {/* Netflix-style Featured Hero Section with 3D */}
      {featuredItem && (
        <section className="relative h-[75vh] md:h-[85vh] overflow-hidden">
          {/* 3D Scene Background */}
          <Hero3DScene />
          
          {/* Background Image with Advanced Gradient Overlay */}
          <div className="absolute inset-0">
            {featuredItem.images && Array.isArray(featuredItem.images) && featuredItem.images.length > 0 ? (
              <>
                {(() => {
                  const imageUrl = supabase.storage.from('item-images').getPublicUrl(featuredItem.images[0]).data.publicUrl;
                  return (
                    <img
                      src={imageUrl}
                      alt={featuredItem.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 opacity-75"
                      onLoad={() => console.log('✅ Featured image loaded:', imageUrl)}
                      onError={(e) => {
                        console.error('❌ Failed to load image:', imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  );
                })()}
              </>
            ) : (
              <div className="w-full h-full gradient-hero animate-shimmer opacity-20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
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

      {/* Animated Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay: '1.5s'}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '5000+', label: 'Active Users', color: 'text-primary' },
              { icon: ShoppingBag, value: '10000+', label: 'Items Listed', color: 'text-secondary' },
              { icon: TrendingUp, value: '95%', label: 'Satisfaction Rate', color: 'text-accent' },
              { icon: Sparkles, value: '24/7', label: 'Support', color: 'text-primary' },
            ].map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-8 rounded-2xl glass-effect hover-lift group animate-scale-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <stat.icon className={`h-12 w-12 mx-auto mb-4 ${stat.color} group-hover:scale-125 transition-transform duration-500`} />
                <div className="text-4xl font-bold mb-2 text-gradient">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border-4 border-primary/20 rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-16 h-16 border-4 border-accent/20 rounded-lg animate-float rotate-45" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-20 left-1/3 w-24 h-24 border-4 border-secondary/20 rounded-full animate-float" style={{animationDelay: '2s'}} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4 shadow-glow px-4 py-2 text-base">
              <Zap className="h-4 w-4 mr-2 inline" />
              Simple Process
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gradient animate-fade-in">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in just three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-20" />
            
            {[
              {
                step: '01',
                icon: Users,
                title: 'Create Account',
                description: 'Sign up in seconds with your email or Google account',
                color: 'from-primary to-primary-glow'
              },
              {
                step: '02',
                icon: ShoppingBag,
                title: 'Browse or List',
                description: 'Explore items from your community or list your own',
                color: 'from-secondary to-secondary-glow'
              },
              {
                step: '03',
                icon: Shield,
                title: 'Connect & Trade',
                description: 'Chat securely and complete your transaction safely',
                color: 'from-accent to-primary'
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="relative group animate-fade-in-up"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                {/* Step circle */}
                <div className="relative mx-auto w-32 h-32 mb-8">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500 blur-xl`} />
                  <div className={`relative w-full h-full bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <item.icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-background border-4 border-primary rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl text-primary shadow-lg">
                    {item.step}
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-gradient transition-all">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-effect rounded-3xl p-12 md:p-16 shadow-2xl animate-scale-in">
            <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary animate-glow" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
              Join thousands of community members already buying and selling on SocietyMart
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {user ? (
                <Button 
                  size="lg" 
                  variant="premium"
                  onClick={() => navigate('/sell')}
                  className="gap-2 text-lg px-10 py-6 shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50"
                >
                  <ShoppingBag className="h-5 w-5" />
                  List Your Item
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    variant="premium"
                    onClick={() => navigate('/auth')}
                    className="gap-2 text-lg px-10 py-6 shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50"
                  >
                    <Sparkles className="h-5 w-5" />
                    Get Started Free
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/search')}
                    className="gap-2 text-lg px-10 py-6 glass-effect hover:bg-primary/10"
                  >
                    Browse Items
                  </Button>
                </>
              )}
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