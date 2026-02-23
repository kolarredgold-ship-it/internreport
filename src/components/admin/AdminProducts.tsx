import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Upload, Copy, Loader2, Package, Download, ImagePlus, Sparkles } from 'lucide-react';

interface DigitalProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  offer_price: number;
  actual_price: number;
  image_url: string | null;
  download_url: string;
  is_active: boolean;
  category: string;
  download_count: number;
  created_at: string;
}

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DigitalProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerPrice, setOfferPrice] = useState('299');
  const [actualPrice, setActualPrice] = useState('14999');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [category, setCategory] = useState('general');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts((data as unknown as DigitalProduct[]) || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load products.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const resetForm = () => {
    setTitle(''); setDescription(''); setOfferPrice('299'); setActualPrice('14999');
    setDownloadUrl(''); setCategory('general'); setImageFile(null); setImagePreview(null);
    setIsActive(true); setEditing(null);
  };

  const openEditForm = (product: DigitalProduct) => {
    setEditing(product);
    setTitle(product.title);
    setDescription(product.description);
    setOfferPrice(String(product.offer_price || 299));
    setActualPrice(String(product.actual_price || 14999));
    setDownloadUrl(product.download_url);
    setCategory(product.category);
    setIsActive(product.is_active);
    setImagePreview(product.image_url);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim() || !downloadUrl.trim()) {
      toast({ title: 'Missing fields', description: 'Title and download link are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editing?.image_url || null;
      if (imageFile) { setUploading(true); imageUrl = await uploadImage(imageFile); setUploading(false); }

      const productData = {
        title: title.trim(),
        slug: generateSlug(title),
        description: description.trim(),
        price: parseFloat(offerPrice) || 0,
        offer_price: parseFloat(offerPrice) || 299,
        actual_price: parseFloat(actualPrice) || 14999,
        download_url: downloadUrl.trim(),
        image_url: imageUrl,
        is_active: isActive,
        category: category.trim(),
      };

      if (editing) {
        const { error } = await supabase.from('digital_products').update(productData as any).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Product Updated' });
      } else {
        const { error } = await supabase.from('digital_products').insert(productData as any);
        if (error) throw error;
        toast({ title: 'Product Created' });
      }
      resetForm(); setShowForm(false); fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setSaving(false); setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('digital_products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product Deleted' }); fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/products/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied!', description: url });
  };

  const generateAllImages = async () => {
    const productsWithoutImages = products.filter(p => !p.image_url);
    if (productsWithoutImages.length === 0) {
      toast({ title: 'All products already have images!' });
      return;
    }

    setGeneratingImages(true);
    setImageProgress({ current: 0, total: productsWithoutImages.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < productsWithoutImages.length; i++) {
      const product = productsWithoutImages[i];
      setImageProgress({ current: i + 1, total: productsWithoutImages.length });

      try {
        const { data, error } = await supabase.functions.invoke('generate-product-images', {
          body: { productId: product.id, title: product.title },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        successCount++;
      } catch (err: any) {
        console.error(`Failed for ${product.title}:`, err);
        failCount++;
        // If rate limited, wait 10s then continue
        if (err?.message?.includes('Rate limited') || err?.message?.includes('429')) {
          toast({ title: 'Rate limited', description: 'Waiting 10s before continuing...', variant: 'destructive' });
          await new Promise(r => setTimeout(r, 10000));
        }
      }

      // Small delay between requests to avoid rate limiting
      if (i < productsWithoutImages.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setGeneratingImages(false);
    toast({
      title: 'Image Generation Complete',
      description: `${successCount} generated, ${failCount} failed`,
    });
    fetchProducts();
  };

  const generateSingleImage = async (product: DigitalProduct) => {
    try {
      toast({ title: 'Generating image...', description: product.title });
      const { data, error } = await supabase.functions.invoke('generate-product-images', {
        body: { productId: product.id, title: product.title },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Image Generated!', description: product.title });
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  const totalDownloads = products.reduce((sum, p) => sum + (p.download_count || 0), 0);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5" /> Digital Products ({products.length})
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Download className="w-4 h-4" /> Total Downloads: {totalDownloads}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={generateAllImages}
            disabled={generatingImages}
          >
            {generatingImages ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating {imageProgress.current}/{imageProgress.total}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate All Images</>
            )}
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[150px] truncate text-sm">{product.title}</TableCell>
                  <TableCell className="text-green-600 font-semibold">₹{product.offer_price || 299}</TableCell>
                  <TableCell className="text-muted-foreground line-through text-sm">₹{product.actual_price || 14999}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Download className="w-3 h-3" /> {product.download_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{product.category}</Badge></TableCell>
                  <TableCell>
                    <Badge className={product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!product.image_url && (
                        <Button size="sm" variant="ghost" onClick={() => generateSingleImage(product)} title="Generate AI Image">
                          <ImagePlus className="w-3.5 h-3.5 text-primary" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => copyShareLink(product.slug)}><Copy className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditForm(product)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)} disabled={deleting === product.id}>
                        {deleting === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { resetForm(); setShowForm(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Image</Label>
              <div className="mt-1">
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />}
                <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{imageFile ? imageFile.name : 'Choose image...'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ChatGPT Prompts Bundle" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe product..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Offer Price (₹)</Label>
                <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="299" />
              </div>
              <div>
                <Label>Actual Price (₹)</Label>
                <Input type="number" value={actualPrice} onChange={(e) => setActualPrice(e.target.value)} placeholder="14999" />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. templates" />
            </div>
            <div>
              <Label>Download URL *</Label>
              <Input value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploading ? 'Uploading...' : 'Saving...'}</> : editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
