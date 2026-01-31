import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import BOMPanel from '../components/BOMPanel';
import MeasurementChartPanel from '../components/MeasurementChartPanel';
import { 
  Save, Trash2, Image, Plus, X, ChevronRight,
  Package, FileText, ClipboardCheck, Settings, MessageSquare,
  Target, File, Layers, DollarSign, ShoppingCart, Clock, List,
  Barcode, Palette, Ruler
} from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  const [activeTopTab, setActiveTopTab] = useState('item');
  
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
    custom_fields: {},
    bom: [],
    measurements: [],
    status: 'draft',
    primary_image_url: '',
    media: [],
    source_asset_id: ''
  });

  const [divisions, setDivisions] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pomList, setPomList] = useState([]);
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
      const [divisionsRes, typesRes, colorsRes, sizesRes, suppliersRes, buyersRes, seasonsRes, materialsRes, pomRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/product-types'),
        api.get('/colors'),
        api.get('/sizes'),
        api.get('/suppliers'),
        api.get('/buyers'),
        api.get('/seasons'),
        api.get('/materials'),
        api.get('/pom')
      ]);
      setDivisions(divisionsRes.data);
      setProductTypes(typesRes.data);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
      setSuppliers(suppliersRes.data);
      setBuyers(buyersRes.data);
      setSeasons(seasonsRes.data);
      setMaterials(materialsRes.data);
      setPomList(pomRes.data);
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
        toast.success('Product created');
        navigate(`/products/${response.data.id}`);
      } else {
        await api.put(`/products/${id}`, formData);
        toast.success('Product saved');
      }
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this product?')) return;
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

  const handleMediaUpload = (mediaItem) => {
    setFormData({
      ...formData,
      media: [...formData.media, mediaItem],
      primary_image_url: formData.primary_image_url || mediaItem.url
    });
  };

  const addSkuVariant = () => {
    const newSku = {
      id: `sku-${Date.now()}`,
      sku_code: '',
      color_id: '',
      size_id: '',
      barcode: ''
    };
    setFormData({ ...formData, sku_variants: [...formData.sku_variants, newSku] });
  };

  const updateSkuVariant = (skuId, field, value) => {
    const updatedVariants = formData.sku_variants.map(sku => 
      sku.id === skuId ? { ...sku, [field]: value } : sku
    );
    setFormData({ ...formData, sku_variants: updatedVariants });
  };

  const removeSkuVariant = (skuId) => {
    setFormData({ ...formData, sku_variants: formData.sku_variants.filter(s => s.id !== skuId) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const sidebarSections = [
    { id: 'info', name: 'Item Information', icon: FileText },
    { id: 'bom', name: 'Bill of Materials', icon: Layers },
    { id: 'colors', name: 'Colors', icon: Palette },
    { id: 'sizes', name: 'Sizes', icon: Ruler },
    { id: 'skus', name: 'SKU Codes', icon: Barcode },
    { id: 'files', name: 'Files', icon: File },
    { id: 'specs', name: 'Specifications', icon: Settings, hasArrow: true },
    { id: 'approvals', name: 'Approvals', icon: ClipboardCheck, hasArrow: true },
  ];

  const topTabs = [
    { id: 'item', name: 'Item' },
    { id: 'costing', name: 'Costing' },
    { id: 'buying', name: 'Buying' },
    { id: 'timeline', name: 'Time & Action' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'log', name: 'Log' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="product-detail-page">
      {/* Top Header Bar */}
      <div className="bg-white border-b sticky top-0 z-50">
        {/* Breadcrumbs */}
        <div className="px-6 py-2 text-sm text-slate-500 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link to="/products" className="hover:text-slate-700">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-400">{seasons.find(s => s.id === formData.season_id)?.name || 'All Seasons'}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-700">{formData.name || 'New Product'}</span>
          </div>
        </div>

        {/* Product Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Product Image */}
            <div className="w-16 h-16 rounded-lg bg-slate-100 border flex items-center justify-center overflow-hidden">
              {formData.primary_image_url ? (
                <img 
                  src={formData.primary_image_url} 
                  alt={formData.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-8 w-8 text-slate-300" />
              )}
            </div>
            
            {/* Product Info */}
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-mono">{formData.code || 'NEW'}</span>
                <span>|</span>
                <span>{suppliers.find(s => s.id === formData.supplier_id)?.name || 'No Supplier'}</span>
                {formData.source_asset_id && (
                  <>
                    <span>|</span>
                    <Badge variant="outline" className="text-xs">From Asset</Badge>
                  </>
                )}
              </div>
              <h1 className="text-xl font-semibold text-slate-800">
                {formData.name || 'New Product'}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Target className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <File className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-8" />
            {!isNew && (
              <Button variant="outline" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} data-testid="save-product-btn">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Top Tabs */}
        <div className="px-6 flex gap-1 border-t border-slate-100">
          {topTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTopTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTopTab === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r min-h-[calc(100vh-180px)] sticky top-[180px]">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Item
              </h3>
              <nav className="space-y-1">
                {sidebarSections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className="h-4 w-4" />
                      <span>{section.name}</span>
                    </div>
                    {section.hasArrow && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </nav>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Item Information Section */}
          {activeSection === 'info' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Product Code *</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., PRD-001"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Product Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Describe this product..."
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label>Division</Label>
                      <Select
                        value={formData.division_id || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, division_id: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
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
                        value={formData.product_type_id || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, product_type_id: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {productTypes.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Season</Label>
                      <Select
                        value={formData.season_id || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, season_id: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {seasons.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lifecycle Stage</Label>
                      <Select
                        value={formData.lifecycle_stage}
                        onValueChange={(v) => setFormData({ ...formData, lifecycle_stage: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lifecycleStages.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Select
                        value={formData.supplier_id || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, supplier_id: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Material Description</Label>
                      <Input
                        value={formData.material_description}
                        onChange={(e) => setFormData({ ...formData, material_description: e.target.value })}
                        placeholder="e.g., 100% Cotton Jersey"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Media</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setUploadPanelOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.media.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Image className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No media uploaded</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setUploadPanelOpen(true)}
                      >
                        Upload Media
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-3">
                      {formData.media.map((item, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Additional notes..."
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bill of Materials Section */}
          {activeSection === 'bom' && (
            <BOMPanel
              bom={formData.bom || []}
              onChange={(bom) => setFormData({ ...formData, bom })}
              materials={materials}
              colors={colors}
              sizes={sizes}
            />
          )}

          {/* Colors Section */}
          {activeSection === 'colors' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.color_ids.map(colorId => {
                    const color = colors.find(c => c.id === colorId);
                    if (!color) return null;
                    return (
                      <Badge key={colorId} variant="secondary" className="gap-2 pr-1">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: color.hex_code }}
                        />
                        {color.name}
                        <button 
                          onClick={() => setFormData({
                            ...formData,
                            color_ids: formData.color_ids.filter(id => id !== colorId)
                          })}
                          className="hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <Select
                  onValueChange={(v) => {
                    if (!formData.color_ids.includes(v)) {
                      setFormData({ ...formData, color_ids: [...formData.color_ids, v] });
                    }
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.filter(c => !formData.color_ids.includes(c.id)).map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex_code }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Sizes Section */}
          {activeSection === 'sizes' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.size_ids.map(sizeId => {
                    const size = sizes.find(s => s.id === sizeId);
                    if (!size) return null;
                    return (
                      <Badge key={sizeId} variant="secondary" className="gap-1 pr-1">
                        {size.name}
                        <button 
                          onClick={() => setFormData({
                            ...formData,
                            size_ids: formData.size_ids.filter(id => id !== sizeId)
                          })}
                          className="hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <Select
                  onValueChange={(v) => {
                    if (!formData.size_ids.includes(v)) {
                      setFormData({ ...formData, size_ids: [...formData.size_ids, v] });
                    }
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Add a size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.filter(s => !formData.size_ids.includes(s.id)).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* SKU Codes Section */}
          {activeSection === 'skus' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">SKU Codes</CardTitle>
                  <Button size="sm" onClick={addSkuVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add SKU
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.sku_variants.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Barcode className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No SKU codes defined</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={addSkuVariant}>
                      Add First SKU
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU Code</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.sku_variants.map(sku => (
                        <TableRow key={sku.id}>
                          <TableCell>
                            <Input
                              value={sku.sku_code}
                              onChange={(e) => updateSkuVariant(sku.id, 'sku_code', e.target.value)}
                              placeholder="SKU-001"
                              className="font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={sku.color_id || '__none__'}
                              onValueChange={(v) => updateSkuVariant(sku.id, 'color_id', v === '__none__' ? '' : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {colors.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={sku.size_id || '__none__'}
                              onValueChange={(v) => updateSkuVariant(sku.id, 'size_id', v === '__none__' ? '' : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {sizes.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={sku.barcode}
                              onChange={(e) => updateSkuVariant(sku.id, 'barcode', e.target.value)}
                              placeholder="Barcode"
                              className="font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeSkuVariant(sku.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Files Section */}
          {activeSection === 'files' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Files & Documents</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <File className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No files uploaded</p>
                  <p className="text-sm text-slate-400 mt-1">Drag and drop files here or click to upload</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specifications Section */}
          {activeSection === 'specs' && (
            <MeasurementChartPanel
              measurements={formData.measurements || []}
              onChange={(measurements) => setFormData({ ...formData, measurements })}
              sizes={sizes}
              pomList={pomList}
            />
          )}

          {/* Approvals Section */}
          {activeSection === 'approvals' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No approval workflow configured</p>
                  <p className="text-sm text-slate-400 mt-1">Set up approval stages for this product</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Panel */}
      <MediaUploadPanel
        isOpen={uploadPanelOpen}
        onClose={() => setUploadPanelOpen(false)}
        onUpload={handleMediaUpload}
        entityType="product"
        entityId={isNew ? '' : id}
        api={api}
      />
    </div>
  );
};

export default ProductDetailPage;
