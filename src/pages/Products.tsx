import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Search, Package, Share2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import PaymentModal from '@/components/PaymentModal';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  offer_price: number;
  actual_price: number;
  image_url: string | null;
  download_url: string;
  category: string;
  download_count: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentProduct, setPaymentProduct] = useState<Product | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error) setProducts((data as unknown as Product[]) || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const shareProduct = (slug: string, title: string) => {
    const url = `${window.location.origin}/products/${slug}`;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied!', description: url });
    }
  };

  const handleBuy = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to purchase products.', variant: 'destructive' });
      return;
    }
    setPaymentProduct(product);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    toast({ title: 'Payment Submitted!', description: 'You will receive the download link after verification.' });
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>2000+ Digital Products | InternReport.in</title>
        <meta name="description" content="Browse 2000+ premium digital products - templates, prompts, ebooks, courses and more. Offer price ₹299 (worth ₹14,999)." />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl">InternReport.in</span>
          </Link>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/auth">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
            )}
            <Link to="/">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <Badge className="mb-3 bg-green-500/10 text-green-600 border-green-500/20">
            🔥 Worth ₹14,999 — Now Only ₹299
          </Badge>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            2000+ Digital Products Store
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Premium digital resources — templates, prompts, ebooks, video courses, bundles & more
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-6 sm:mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6 sm:mb-8">
            <Badge
              variant={search === '' ? 'default' : 'secondary'}
              className="cursor-pointer text-xs"
              onClick={() => setSearch('')}
            >
              All
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={search === cat ? 'default' : 'secondary'}
                className="cursor-pointer text-xs"
                onClick={() => setSearch(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-soft group">
                <Link to={`/products/${product.slug}`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-28 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-28 sm:h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Package className="w-8 h-8 sm:w-12 sm:h-12 text-primary/30" />
                    </div>
                  )}
                </Link>
                <CardContent className="p-3 sm:p-4">
                  <Badge variant="secondary" className="mb-1.5 text-[10px] sm:text-xs">{product.category}</Badge>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-display font-semibold text-xs sm:text-base mb-1 line-clamp-2 hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                    <span className="font-bold text-green-600 text-sm sm:text-lg">₹{product.offer_price || 299}</span>
                    {(product.actual_price > 0) && (
                      <span className="text-[10px] sm:text-sm text-muted-foreground line-through">₹{product.actual_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 sm:h-8 sm:w-8" onClick={(e) => { e.preventDefault(); shareProduct(product.slug, product.title); }}>
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="gradient" className="h-7 text-[10px] sm:text-xs sm:h-8 flex-1 gap-1" onClick={(e) => handleBuy(product, e)}>
                      <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Buy Now</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {paymentProduct && user && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => { setShowPayment(false); setPaymentProduct(null); }}
          amount={paymentProduct.offer_price || 299}
          reportId={null}
          userId={user.id}
          onSuccess={handlePaymentSuccess}
          paymentType="topup"
        />
      )}
    </div>
  );
};

export default Products;
