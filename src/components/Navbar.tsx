import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MessageCircle, User, LogOut, Plus, Search, Heart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-border/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <ShoppingBag className="h-8 w-8 text-primary animate-glow transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-glow" />
              </div>
              <span className="text-xl font-bold text-gradient">SocietyMart</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-all">
                  <Link to="/" className="gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-all">
                  <Link to="/search" className="gap-2">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </Link>
                </Button>
                <Button asChild variant="premium" size="sm" className="shadow-lg shadow-primary/25">
                  <Link to="/sell" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Sell Item</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-all">
                  <Link to="/wishlist" className="gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Wishlist</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-all">
                  <Link to="/chats" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Chats</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-all gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-effect">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile">Edit Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild variant="premium" size="sm" className="shadow-lg shadow-primary/25">
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}