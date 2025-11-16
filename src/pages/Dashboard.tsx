import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
import EditItemDialog from '@/components/EditItemDialog';

export default function Dashboard() {
  const [myItems, setMyItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, sold: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  useEffect(() => {
    fetchMyItems();
  }, [user]);

  const fetchMyItems = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch your items',
        variant: 'destructive',
      });
    } else {
      setMyItems(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const sold = data?.filter(item => item.status === 'sold').length || 0;
      const available = data?.filter(item => item.status === 'available').length || 0;
      
      setStats({ total, sold, available });
    }

    setLoading(false);
  };

  const handleMarkAsSold = async (itemId: string) => {
    const { error } = await supabase
      .from('items')
      .update({ status: 'sold' })
      .eq('id', itemId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark item as sold',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Item marked as sold',
      });
      fetchMyItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
      fetchMyItems();
    }
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <Button onClick={() => navigate('/sell')}>
            <Plus className="h-4 w-4 mr-2" />
            List New Item
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : myItems.length > 0 ? (
              <div className="space-y-4">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={`${supabase.storage.from('item-images').getPublicUrl(item.images[0]).data.publicUrl}`}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={item.status === 'sold' ? 'destructive' : 'secondary'}
                          >
                            {item.status}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status === 'available' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsSold(item.id)}
                        >
                          Mark as Sold
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't listed any items yet</p>
                <Button onClick={() => navigate('/sell')}>
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Item
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={selectedItem}
        onSuccess={fetchMyItems}
      />
    </div>
  );
}