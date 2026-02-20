import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Search, Package, ExternalLink, Share2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  image_url: string | null;
  download_url: string;
  category: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

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

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>Digital Products | InternReport.in</title>
        <meta name="description" content="Browse premium digital products - templates, prompts, ebooks, and more at best prices." />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Home</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Digital Products Store
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Premium digital resources — templates, prompts, ebooks, bundles & more
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8 relative">
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
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <Badge
              variant={search === '' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSearch('')}
            >
              All
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={search === cat ? 'default' : 'secondary'}
                className="cursor-pointer"
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-soft group">
                <Link to={`/products/${product.slug}`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Package className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                </Link>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">{product.category}</Badge>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-display font-semibold text-lg mb-1 line-clamp-2 hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">
                      {product.price > 0 ? `₹${product.price}` : <span className="text-green-600">Free</span>}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); shareProduct(product.slug, product.title); }}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Link to={`/products/${product.slug}`}>
                        <Button size="sm" variant="gradient">View</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
