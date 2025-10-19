export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">SocietyMart</h3>
            <p className="text-sm text-muted-foreground">Your exclusive community marketplace for buying and selling within your society, PG, or hostel.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/" className="hover:text-primary transition-colors">Home</a></li>
              <li><a href="/search" className="hover:text-primary transition-colors">Search</a></li>
              <li><a href="/sell" className="hover:text-primary transition-colors">Sell Item</a></li>
              <li><a href="/wishlist" className="hover:text-primary transition-colors">Wishlist</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <p className="text-sm text-muted-foreground">Connect with buyers and sellers in your community through our secure platform.</p>
          </div>
        </div>
        <div className="border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Designed by <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Manoj Jangra</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} SocietyMart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}