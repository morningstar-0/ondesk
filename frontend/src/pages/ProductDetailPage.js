import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import { ArrowLeft, Save, Trash2, Upload, Image, ExternalLink, Plus, X, Barcode } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    division_id: '',
    product_type_id: '',
    product_subtype_id: '',
    material_description: '',
    buyer_ids: [],
    supplier_id: '',
    season_id: '',
    lifecycle_stage: 'concept',
    notes: '',
    tags: [],
    color_ids: [],
    size_ids: [],
    sku_variants: [],
    status: 'draft',
    primary_image_url: '',
    media: [],
    custom_fields: {},
    bom: [],
    measurements: [],
    source_asset_id: ''
  });

  const [divisions, setDivisions] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [newTag, setNewTag] = useState('');

  const lifecycleStages = [
    { value: 'concept', label: 'Concept' },
    { value: 'development', label: 'Development' },
    { value: 'sampling', label: 'Sampling' },
    { value: 'production', label: 'Production' },
    { value: 'active', label: 'Active' },
    { value: 'discontinued', label: 'Discontinued' }
  ];

  const fetchProduct = useCallback(async () => {
    if (isNew) return;
    try {
      const response = await api.get(`/products/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [api, id, isNew, navigate]);

  const fetchLibraries = useCallback(async () => {
    try {
      const [divisionsRes, typesRes, colorsRes, sizesRes, suppliersRes, buyersRes, seasonsRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/product-types'),
        api.get('/colors'),
        api.get('/sizes'),
        api.get('/suppliers'),
        api.get('/buyers'),
        api.get('/seasons')
      ]);
      setDivisions(divisionsRes.data);
      setProductTypes(typesRes.data);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
      setSuppliers(suppliersRes.data);
      setBuyers(buyersRes.data);
      setSeasons(seasonsRes.data);
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchProduct();
    fetchLibraries();
  }, [fetchProduct, fetchLibraries]);

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const response = await api.post('/products', formData);
        toast.success('Product created successfully');
        navigate(`/products/${response.data.id}`);
      } else {
        await api.put(`/products/${id}`, formData);
        toast.success('Product saved successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const generateSKUVariants = () => {
    const variants = [];
    const selectedColors = colors.filter(c => formData.color_ids.includes(c.id));
    const selectedSizes = sizes.filter(s => formData.size_ids.includes(s.id));

    if (selectedColors.length === 0 && selectedSizes.length === 0) {
      variants.push({
        id: `sku-${Date.now()}`,
        color_id: '',
        color_name: '',
        size_id: '',
        size_name: '',
        sku_code: `${formData.code}-001`,
        barcode: '',
        price: 0,
        cost: 0
      });
    } else if (selectedColors.length === 0) {
      selectedSizes.forEach((size, i) => {
        variants.push({
          id: `sku-${Date.now()}-${i}`,
          color_id: '',
          color_name: '',
          size_id: size.id,
          size_name: size.name,
          sku_code: `${formData.code}-${size.code}`,
          barcode: '',
          price: 0,
          cost: 0
        });
      });
    } else if (selectedSizes.length === 0) {
      selectedColors.forEach((color, i) => {
        variants.push({
          id: `sku-${Date.now()}-${i}`,
          color_id: color.id,
          color_name: color.name,
          size_id: '',
          size_name: '',
          sku_code: `${formData.code}-${color.name.substring(0, 3).toUpperCase()}`,
          barcode: '',
          price: 0,
          cost: 0
        });
      });
    } else {
      let idx = 0;
      selectedColors.forEach(color => {
        selectedSizes.forEach(size => {
          variants.push({
            id: `sku-${Date.now()}-${idx++}`,
            color_id: color.id,
            color_name: color.name,
            size_id: size.id,
            size_name: size.name,
            sku_code: `${formData.code}-${color.name.substring(0, 3).toUpperCase()}-${size.code}`,
            barcode: '',
            price: 0,
            cost: 0
          });
        });
      });
    }

    setFormData({ ...formData, sku_variants: variants });
    toast.success(`Generated ${variants.length} SKU variant(s)`);
  };

  const updateSKUVariant = (variantId, field, value) => {
    setFormData({
      ...formData,
      sku_variants: formData.sku_variants.map(v =>
        v.id === variantId ? { ...v, [field]: value } : v
      )
    });
  };

  const handleUploadComplete = (results) => {
    const newMedia = results.map(r => r.entity?.media?.[0] || r.media).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...newMedia],
      primary_image_url: prev.primary_image_url || newMedia[0]?.url || ''
    }));
    setUploadPanelOpen(false);
  };

  const removeMedia = (mediaId) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter(m => m.id !== mediaId),
      primary_image_url: prev.primary_image_url === prev.media.find(m => m.id === mediaId)?.url ? '' : prev.primary_image_url
    }));
  };

  const setPrimaryImage = (url) => {
    setFormData({ ...formData, primary_image_url: url });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="product-detail-page">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-['Public_Sans']">
                  {isNew ? 'New Product' : formData.name || 'Product'}
                </h1>
                {formData.source_asset_id && (
                  <Badge variant="outline">From Asset</Badge>
                )}
              </div>
              {!isNew && <p className="text-sm text-muted-foreground font-mono">{formData.code}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open(window.location.href, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
            {!isNew && (
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} data-testid="save-product-btn">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Media</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setUploadPanelOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg border bg-muted overflow-hidden mb-4">
                  {formData.primary_image_url ? (
                    <img src={formData.primary_image_url} alt={formData.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {formData.media.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer ${
                        formData.primary_image_url === item.url ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setPrimaryImage(item.url)}
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                      <button
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                        onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center hover:border-primary"
                    onClick={() => setUploadPanelOpen(true)}
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lifecycle Stage</Label>
                  <Select value={formData.lifecycle_stage} onValueChange={(v) => setFormData({ ...formData, lifecycle_stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {lifecycleStages.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="PRD-001"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Division</Label>
                    <Select value={formData.division_id} onValueChange={(v) => setFormData({ ...formData, division_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select value={formData.product_type_id} onValueChange={(v) => setFormData({ ...formData, product_type_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {productTypes.filter(t => !t.parent_id).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Subtype</Label>
                    <Select value={formData.product_subtype_id} onValueChange={(v) => setFormData({ ...formData, product_subtype_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {productTypes.filter(t => t.parent_id === formData.product_type_id).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Material Description</Label>
                  <Textarea
                    value={formData.material_description}
                    onChange={(e) => setFormData({ ...formData, material_description: e.target.value })}
                    rows={2}
                    placeholder="Describe materials used..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                    <Button variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">{tag}<X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} /></Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="sourcing" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
                <TabsTrigger value="colors">Colors & Sizes</TabsTrigger>
                <TabsTrigger value="skus">SKU Codes</TabsTrigger>
                <TabsTrigger value="barcodes">Barcodes</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="sourcing" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Season</Label>
                        <Select value={formData.season_id} onValueChange={(v) => setFormData({ ...formData, season_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Buyers</Label>
                      <div className="flex flex-wrap gap-2">
                        {buyers.map(buyer => (
                          <button
                            key={buyer.id}
                            className={`px-3 py-1.5 rounded-md border text-sm ${formData.buyer_ids.includes(buyer.id) ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
                            onClick={() => {
                              const ids = formData.buyer_ids.includes(buyer.id)
                                ? formData.buyer_ids.filter(id => id !== buyer.id)
                                : [...formData.buyer_ids, buyer.id];
                              setFormData({ ...formData, buyer_ids: ids });
                            }}
                          >
                            {buyer.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Colors</Label>
                      <div className="flex flex-wrap gap-2">
                        {colors.map(color => (
                          <button
                            key={color.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${formData.color_ids.includes(color.id) ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
                            onClick={() => {
                              const ids = formData.color_ids.includes(color.id) ? formData.color_ids.filter(id => id !== color.id) : [...formData.color_ids, color.id];
                              setFormData({ ...formData, color_ids: ids });
                            }}
                          >
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex_code }} />
                            <span className="text-sm">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sizes</Label>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map(size => (
                          <button
                            key={size.id}
                            className={`px-3 py-1.5 rounded-md border text-sm ${formData.size_ids.includes(size.id) ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
                            onClick={() => {
                              const ids = formData.size_ids.includes(size.id) ? formData.size_ids.filter(id => id !== size.id) : [...formData.size_ids, size.id];
                              setFormData({ ...formData, size_ids: ids });
                            }}
                          >
                            {size.name} ({size.code})
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skus" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">SKU Variants</CardTitle>
                      <Button size="sm" onClick={generateSKUVariants}>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate SKUs
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Color</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>SKU Code</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.sku_variants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Select colors and sizes, then click "Generate SKUs"
                            </TableCell>
                          </TableRow>
                        ) : (
                          formData.sku_variants.map(variant => (
                            <TableRow key={variant.id}>
                              <TableCell>
                                {variant.color_name ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: colors.find(c => c.id === variant.color_id)?.hex_code }} />
                                    {variant.color_name}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>{variant.size_name || '-'}</TableCell>
                              <TableCell>
                                <Input
                                  value={variant.sku_code}
                                  onChange={(e) => updateSKUVariant(variant.id, 'sku_code', e.target.value)}
                                  className="h-8 font-mono"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateSKUVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                  className="h-8 w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={variant.cost}
                                  onChange={(e) => updateSKUVariant(variant.id, 'cost', parseFloat(e.target.value) || 0)}
                                  className="h-8 w-24"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="barcodes" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Barcode className="h-5 w-5" />
                      Barcodes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU Code</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Barcode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.sku_variants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Generate SKUs first to add barcodes
                            </TableCell>
                          </TableRow>
                        ) : (
                          formData.sku_variants.map(variant => (
                            <TableRow key={variant.id}>
                              <TableCell className="font-mono">{variant.sku_code}</TableCell>
                              <TableCell>{variant.color_name || '-'}</TableCell>
                              <TableCell>{variant.size_name || '-'}</TableCell>
                              <TableCell>
                                <Input
                                  value={variant.barcode || ''}
                                  onChange={(e) => updateSKUVariant(variant.id, 'barcode', e.target.value)}
                                  className="h-8 font-mono"
                                  placeholder="Enter barcode..."
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={6}
                      placeholder="Add internal notes..."
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <MediaUploadPanel
        isOpen={uploadPanelOpen}
        onClose={() => setUploadPanelOpen(false)}
        onUploadComplete={handleUploadComplete}
        entityType="product"
        entityId={isNew ? '' : id}
        api={api}
      />
    </div>
  );
};

export default ProductDetailPage;
