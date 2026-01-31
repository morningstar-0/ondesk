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
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import FullScreenHeader from '../components/FullScreenHeader';
import { Save, Trash2, Upload, Image, Plus, X, DollarSign } from 'lucide-react';

const MaterialDetailPage = () => {
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
    material_type: '',
    composition: '',
    weight: '',
    width: '',
    supplier_id: '',
    unit_price: 0,
    unit: 'meter',
    color_ids: [],
    tags: [],
    certifications: [],
    status: 'active',
    primary_image_url: '',
    media: [],
    custom_fields: {}
  });

  const [divisions, setDivisions] = useState([]);
  const [colors, setColors] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newCert, setNewCert] = useState('');

  const materialTypes = ['Fabric', 'Leather', 'Metal', 'Plastic', 'Wood', 'Glass', 'Rubber', 'Paper', 'Composite', 'Other'];
  const units = ['meter', 'yard', 'kg', 'lb', 'piece', 'roll', 'sheet'];

  const fetchMaterial = useCallback(async () => {
    if (isNew) return;
    try {
      const response = await api.get(`/materials/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load material');
      navigate('/materials');
    } finally {
      setLoading(false);
    }
  }, [api, id, isNew, navigate]);

  const fetchLibraries = useCallback(async () => {
    try {
      const [divisionsRes, colorsRes, suppliersRes] = await Promise.all([
        api.get('/divisions'),
        api.get('/colors'),
        api.get('/suppliers')
      ]);
      setDivisions(divisionsRes.data);
      setColors(colorsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchMaterial();
    fetchLibraries();
  }, [fetchMaterial, fetchLibraries]);

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const response = await api.post('/materials', formData);
        toast.success('Material created');
        navigate(`/materials/${response.data.id}`);
      } else {
        await api.put(`/materials/${id}`, formData);
        toast.success('Material saved');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      toast.success('Material deleted');
      navigate('/materials');
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

  const addCertification = () => {
    if (newCert.trim() && !formData.certifications.includes(newCert.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, newCert.trim()] });
      setNewCert('');
    }
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
      media: prev.media.filter(m => m.id !== mediaId)
    }));
  };

  if (loading) {
    return <div className="animate-pulse space-y-6 p-6"><div className="h-8 w-48 bg-muted rounded" /><div className="h-96 bg-muted rounded-lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="material-detail-page">
      {/* Full Screen Header */}
      <FullScreenHeader
        title={isNew ? 'New Material' : formData.name || 'Material'}
        subtitle={!isNew ? formData.code : null}
        backPath="/materials"
        backLabel="Materials"
        badge={formData.status && !isNew && (
          <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {formData.status}
          </Badge>
        )}
      >
        {!isNew && (
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </FullScreenHeader>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Media</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setUploadPanelOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />Upload
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
                  {formData.media.map(item => (
                    <div
                      key={item.id}
                      className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer ${formData.primary_image_url === item.url ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setFormData({ ...formData, primary_image_url: item.url })}
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                      <button className="absolute top-1 right-1 p-1 bg-black/50 rounded-full" onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}>
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center hover:border-primary" onClick={() => setUploadPanelOpen(true)}>
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Material Type</Label>
                    <Select value={formData.material_type} onValueChange={(v) => setFormData({ ...formData, material_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Division</Label>
                    <Select value={formData.division_id || "__none__"} onValueChange={(v) => setFormData({ ...formData, division_id: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select value={formData.supplier_id || "__none__"} onValueChange={(v) => setFormData({ ...formData, supplier_id: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Composition</Label>
                  <Textarea value={formData.composition} onChange={(e) => setFormData({ ...formData, composition: e.target.value })} rows={2} placeholder="e.g., 80% Cotton, 20% Polyester" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="e.g., 200 gsm" />
                  </div>
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} placeholder="e.g., 150 cm" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })} className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tags & Certifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                    <Button variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">{tag}<X className="h-3 w-3 cursor-pointer" onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })} /></Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <div className="flex gap-2">
                    <Input value={newCert} onChange={(e) => setNewCert(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())} placeholder="e.g., OEKO-TEX, GOTS" />
                    <Button variant="outline" onClick={addCertification}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.certifications.map(cert => (
                      <Badge key={cert} variant="outline" className="gap-1">{cert}<X className="h-3 w-3 cursor-pointer" onClick={() => setFormData({ ...formData, certifications: formData.certifications.filter(c => c !== cert) })} /></Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <MediaUploadPanel isOpen={uploadPanelOpen} onClose={() => setUploadPanelOpen(false)} onUploadComplete={handleUploadComplete} entityType="material" entityId={isNew ? '' : id} api={api} />
    </div>
  );
};

export default MaterialDetailPage;
