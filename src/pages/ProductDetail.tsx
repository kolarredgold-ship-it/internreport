import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Download, Share2, ExternalLink, Package, Copy } from 'lucide-react';
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
  created_at: string;
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!error && data) setProduct(data as unknown as Product);
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied!', description: url });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copied!' });
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen hero-gradient flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <Link to="/products"><Button><ArrowLeft className="w-4 h-4 mr-2" /> Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      <Helmet>
        <title>{product.title} | InternReport.in</title>
        <meta name="description" content={product.description.slice(0, 160)} />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.description.slice(0, 160)} />
        {product.image_url && <meta property="og:image" content={product.image_url} />}
        <link rel="canonical" href={`https://internreport.in/products/${product.slug}`} />
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
          <Link to="/products">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> All Products</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="w-full rounded-2xl shadow-lg object-cover aspect-square" />
            ) : (
              <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Package className="w-24 h-24 text-primary/20" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">{product.category}</Badge>
              <h1 className="font-display text-3xl font-bold mb-3">{product.title}</h1>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="text-3xl font-bold">
              {product.price > 0 ? `₹${product.price}` : <span className="text-green-600">Free</span>}
            </div>

            <div className="space-y-3">
              <a href={product.download_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="gradient" size="lg" className="w-full">
                  <Download className="w-5 h-5 mr-2" />
                  {product.price > 0 ? 'Buy & Download' : 'Download Now'}
                </Button>
              </a>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={shareProduct}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
                <Button variant="outline" className="flex-1" onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </Button>
              </div>
            </div>

            {/* Share URL display */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Product Share Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {window.location.href}
                  </code>
                  <Button size="sm" variant="ghost" onClick={copyLink}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
