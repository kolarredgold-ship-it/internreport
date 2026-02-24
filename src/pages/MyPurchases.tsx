import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Download, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Purchase {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product_id: string | null;
  product_title: string | null;
  product_image: string | null;
  product_slug: string | null;
  download_url: string | null;
}

const MyPurchases = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchPurchases();
  }, [user]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, status, created_at, product_id')
        .eq('user_id', user!.id)
        .eq('payment_type', 'product')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setPurchases([]);
        setLoading(false);
        return;
      }

      // Fetch product details for each purchase
      const productIds = data.filter(p => p.product_id).map(p => p.product_id!);
      let productsMap: Record<string, { title: string; image_url: string | null; slug: string; download_url: string }> = {};

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('digital_products')
          .select('id, title, image_url, slug, download_url')
          .in('id', productIds);

        if (products) {
          products.forEach((p: any) => {
            productsMap[p.id] = p;
          });
        }
      }

      const mapped: Purchase[] = data.map(payment => {
        const product = payment.product_id ? productsMap[payment.product_id] : null;
        return {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          created_at: payment.created_at,
          product_id: payment.product_id,
          product_title: product?.title || 'Unknown Product',
          product_image: product?.image_url || null,
          product_slug: product?.slug || null,
          download_url: product?.download_url || null,
        };
      });

      setPurchases(mapped);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (purchase: Purchase) => {
    if (purchase.status !== 'verified') {
      toast({ title: 'Payment not verified', description: 'Your payment is still being reviewed.', variant: 'destructive' });
      return;
    }
    if (!purchase.download_url) {
      toast({ title: 'Download unavailable', description: 'Download link not found.', variant: 'destructive' });
      return;
    }

    // Increment download count
    if (purchase.product_id) {
      await supabase.rpc('claim_generation_slot', { p_user_id: '' }).then(() => {}); // no-op, just to keep consistent
      // Actually increment download count
      const { data: product } = await supabase
        .from('digital_products')
        .select('download_count')
        .eq('id', purchase.product_id)
        .single();

      if (product) {
        await supabase
          .from('digital_products')
          .update({ download_count: (product.download_count || 0) + 1 })
          .eq('id', purchase.product_id);
      }
    }

    window.open(purchase.download_url, '_blank');
  };

  const statusConfig = {
    verified: { icon: CheckCircle2, label: 'Verified', color: 'text-green-600', bg: 'bg-green-500/10' },
    pending: { icon: Clock, label: 'Pending Verification', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    rejected: { icon: XCircle, label: 'Rejected', color: 'text-destructive', bg: 'bg-destructive/10' },
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">My Purchases</h1>
          <p className="text-muted-foreground">View and download your purchased digital products</p>
        </div>

        {purchases.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6">Browse our digital products store to get started</p>
              <Link to="/products">
                <Button variant="gradient">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const config = statusConfig[purchase.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <Card key={purchase.id} className="border-0 shadow-soft overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Product Image */}
                      <div className="w-full sm:w-32 h-28 sm:h-auto flex-shrink-0">
                        {purchase.product_image ? (
                          <img src={purchase.product_image} alt={purchase.product_title || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center min-h-[7rem]">
                            <Package className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <Link to={purchase.product_slug ? `/products/${purchase.product_slug}` : '#'}>
                            <h3 className="font-display font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-1">
                              {purchase.product_title}
                            </h3>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            Purchased on {new Date(purchase.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${config.bg} ${config.color} border-0 text-[10px] sm:text-xs`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <span className="font-semibold text-sm">₹{purchase.amount}</span>
                          </div>
                        </div>

                        {/* Download Button */}
                        <div className="flex-shrink-0">
                          {purchase.status === 'verified' ? (
                            <Button
                              variant="gradient"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleDownload(purchase)}
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="gap-1.5">
                              <Clock className="w-4 h-4" />
                              Awaiting Verification
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyPurchases;
