import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle } from 'lucide-react';

interface ChatWithDetails {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  items: {
    title: string;
    price: number;
    images: string[];
  };
  buyer_profile?: {
    full_name: string;
  };
  seller_profile?: {
    full_name: string;
  };
  latest_message?: {
    content: string;
    created_at: string;
  };
}

export default function Chats() {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        items (
          title,
          price,
          images
        ),
        buyer_profile:profiles!chats_buyer_id_fkey (
          full_name
        ),
        seller_profile:profiles!chats_seller_id_fkey (
          full_name
        )
      `)
      .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch chats',
        variant: 'destructive',
      });
    } else {
      // Fetch latest message for each chat
      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: messageData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...chat,
            latest_message: messageData
          };
        })
      );
      setChats(chatsWithMessages);
    }

    setLoading(false);
  };

  const getOtherUserName = (chat: ChatWithDetails) => {
    if (chat.buyer_id === user?.id) {
      return chat.seller_profile?.full_name || 'Seller';
    }
    return chat.buyer_profile?.full_name || 'Buyer';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">My Chats</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : chats.length > 0 ? (
          <div className="space-y-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => navigate(`/chats/${chat.id}`)}
                className="bg-card p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {chat.items.images?.[0] ? (
                      <img
                        src={supabase.storage.from('item-images').getPublicUrl(chat.items.images[0]).data.publicUrl}
                        alt={chat.items.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load chat item image:', chat.items.images[0]);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{chat.items.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        ₹{chat.items.price}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      with {getOtherUserName(chat)}
                    </p>
                    {chat.latest_message && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {chat.latest_message.content}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatTime(chat.latest_message.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No chats yet</h2>
            <p className="text-muted-foreground mb-6">
              Start chatting with sellers by browsing items
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