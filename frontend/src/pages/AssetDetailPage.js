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
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import { ArrowLeft, Save, Trash2, ArrowRightLeft, Upload, Image, ExternalLink, Plus, X } from 'lucide-react';

const AssetDetailPage = () => {
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
    tags: [],
    color_ids: [],
    size_ids: [],
    supplier_id: '',
    status: 'draft',
    primary_image_url: '',
    media: [],
    custom_fields: {},
    bom: [],
    measurements: []
  });

  const [divisions, setDivisions] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newTag, setNewTag] = useState('');

  const fetchAsset = useCallback(async () => {
    if (isNew) return;
    try {
      const response = await api.get(`/assets/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load asset');
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  }, [api, id, isNew, navigate]);

  const fetchLibraries = useCallback(async () => {
    try {
      const [divisionsRes, typesRes, colorsRes, sizesRes, suppliersRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/product-types'),
        api.get('/colors'),
        api.get('/sizes'),
        api.get('/suppliers')
      ]);
      setDivisions(divisionsRes.data);
      setProductTypes(typesRes.data);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchAsset();
    fetchLibraries();
  }, [fetchAsset, fetchLibraries]);

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const response = await api.post('/assets', formData);
        toast.success('Asset created successfully');
        navigate(`/assets/${response.data.id}`);
      } else {
        await api.put(`/assets/${id}`, formData);
        toast.success('Asset saved successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      navigate('/assets');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleConvertToProduct = async () => {
    try {
      const response = await api.post(`/assets/${id}/convert-to-product`);
      toast.success('Asset converted to product');
      navigate(`/products/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to convert');
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
    <div className="min-h-screen bg-background" data-testid="asset-detail-page">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-['Public_Sans']">
                {isNew ? 'New Asset' : formData.name || 'Asset'}
              </h1>
              {!isNew && <p className="text-sm text-muted-foreground font-mono">{formData.code}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open(window.location.href, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
            {!isNew && (
              <>
                <Button variant="outline" onClick={handleConvertToProduct}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convert to Product
                </Button>
                <Button variant="destructive" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving} data-testid="save-asset-btn">
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
                {/* Primary Image */}
                <div className="aspect-square rounded-lg border bg-muted overflow-hidden mb-4">
                  {formData.primary_image_url ? (
                    <img
                      src={formData.primary_image_url}
                      alt={formData.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {formData.media.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer ${
                        formData.primary_image_url === item.url ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setPrimaryImage(item.url)}
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                        onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => setUploadPanelOpen(true)}
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardContent className="pt-6">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="AST-001"
                      className="font-mono"
                      data-testid="asset-code-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Asset name"
                      data-testid="asset-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe the asset..."
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Division</Label>
                    <Select
                      value={formData.division_id || "__none__"}
                      onValueChange={(value) => setFormData({ ...formData, division_id: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {divisions.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select
                      value={formData.product_type_id || "__none__"}
                      onValueChange={(value) => setFormData({ ...formData, product_type_id: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {productTypes.filter(t => !t.parent_id).map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Subtype</Label>
                    <Select
                      value={formData.product_subtype_id || "__none__"}
                      onValueChange={(value) => setFormData({ ...formData, product_subtype_id: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subtype" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {productTypes.filter(t => t.parent_id === formData.product_type_id).map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="colors" className="w-full">
              <TabsList>
                <TabsTrigger value="colors">Colors & Sizes</TabsTrigger>
                <TabsTrigger value="supplier">Supplier</TabsTrigger>
                <TabsTrigger value="bom">BOM</TabsTrigger>
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Colors</Label>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <button
                            key={color.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
                              formData.color_ids.includes(color.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                            onClick={() => {
                              const newIds = formData.color_ids.includes(color.id)
                                ? formData.color_ids.filter(id => id !== color.id)
                                : [...formData.color_ids, color.id];
                              setFormData({ ...formData, color_ids: newIds });
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
                        {sizes.map((size) => (
                          <button
                            key={size.id}
                            className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                              formData.size_ids.includes(size.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                            onClick={() => {
                              const newIds = formData.size_ids.includes(size.id)
                                ? formData.size_ids.filter(id => id !== size.id)
                                : [...formData.size_ids, size.id];
                              setFormData({ ...formData, size_ids: newIds });
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

              <TabsContent value="supplier" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <Label>Supplier</Label>
                    <Select
                      value={formData.supplier_id || "__none__"}
                      onValueChange={(value) => setFormData({ ...formData, supplier_id: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bom" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      Bill of Materials - Coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="measurements" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      Measurement Charts - Coming soon
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Upload Panel */}
      <MediaUploadPanel
        isOpen={uploadPanelOpen}
        onClose={() => setUploadPanelOpen(false)}
        onUploadComplete={handleUploadComplete}
        entityType="asset"
        entityId={isNew ? '' : id}
        api={api}
      />
    </div>
  );
};

export default AssetDetailPage;
