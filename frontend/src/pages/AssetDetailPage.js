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
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import BOMPanel from '../components/BOMPanel';
import MeasurementChartPanel from '../components/MeasurementChartPanel';
import { 
  Save, Trash2, ArrowRightLeft, Image, Plus, X, ChevronRight,
  Package, FileText, ClipboardCheck, Settings, MessageSquare,
  Target, File, Layers, Box
} from 'lucide-react';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  
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
    custom_fields: {},
    bom: [],
    measurements: [],
    status: 'draft',
    primary_image_url: '',
    media: []
  });

  const [divisions, setDivisions] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pomList, setPomList] = useState([]);
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
      const [divisionsRes, typesRes, colorsRes, sizesRes, suppliersRes, materialsRes, pomRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/product-types'),
        api.get('/colors'),
        api.get('/sizes'),
        api.get('/suppliers'),
        api.get('/materials'),
        api.get('/pom')
      ]);
      setDivisions(divisionsRes.data);
      setProductTypes(typesRes.data);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
      setSuppliers(suppliersRes.data);
      setMaterials(materialsRes.data);
      setPomList(pomRes.data);
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
        toast.success('Asset created');
        navigate(`/assets/${response.data.id}`);
      } else {
        await api.put(`/assets/${id}`, formData);
        toast.success('Asset saved');
      }
    } catch (error) {
      toast.error('Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this asset?')) return;
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
      toast.success('Converted to product');
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

  const handleMediaUpload = (mediaItem) => {
    setFormData({
      ...formData,
      media: [...formData.media, mediaItem],
      primary_image_url: formData.primary_image_url || mediaItem.url
    });
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
    { id: 'files', name: 'Files', icon: File },
    { id: 'specs', name: 'Specifications', icon: Settings, hasArrow: true },
    { id: 'approvals', name: 'Approvals', icon: ClipboardCheck, hasArrow: true },
  ];

  const topTabs = [
    { id: 'item', name: 'Item', active: true },
    { id: 'costing', name: 'Costing' },
    { id: 'sourcing', name: 'Sourcing' },
    { id: 'timeline', name: 'Time & Action' },
    { id: 'log', name: 'Log' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="asset-detail-page">
      {/* Top Header Bar */}
      <div className="bg-white border-b sticky top-0 z-50">
        {/* Breadcrumbs */}
        <div className="px-6 py-2 text-sm text-slate-500 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link to="/assets" className="hover:text-slate-700">Assets</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-700">{formData.name || 'New Asset'}</span>
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
                <Box className="h-8 w-8 text-slate-300" />
              )}
            </div>
            
            {/* Product Info */}
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-mono">{formData.code || 'NEW'}</span>
                <span>|</span>
                <span>{suppliers.find(s => s.id === formData.supplier_id)?.name || 'No Supplier'}</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">
                {formData.name || 'New Asset'}
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
              <>
                <Button variant="outline" size="sm" onClick={handleConvertToProduct}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convert
                </Button>
                <Button variant="outline" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving} data-testid="save-asset-btn">
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
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab.active 
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
                      <Label>Asset Code *</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., AST-001"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Asset Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter asset name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Describe this asset..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Division</Label>
                      <Select
                        value={formData.division_id || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, division_id: v === '__none__' ? '' : v })}
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
                        value={formData.product_type_id || '__none__'}
                        onValueChange={(v) => setFormData({ ...formData, product_type_id: v === '__none__' ? '' : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="max-w-xs"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button variant="outline" size="sm" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
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
                  <p className="text-sm text-slate-400 mt-1">Set up approval stages for this asset</p>
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
        entityType="asset"
        entityId={isNew ? '' : id}
        api={api}
      />
    </div>
  );
};

export default AssetDetailPage;
