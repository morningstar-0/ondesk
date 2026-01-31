import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Plus, Search, MoreVertical, Pencil, Trash2, ArrowRightLeft, Sparkles, Package, Upload, Image, Loader2 } from 'lucide-react';

const AssetsPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', category: '', status: 'draft'
  });
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchLibraries = useCallback(async () => {
    try {
      const [colorsRes, sizesRes, suppliersRes] = await Promise.all([
        api.get('/colors'),
        api.get('/sizes'),
        api.get('/suppliers')
      ]);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchAssets();
    fetchLibraries();
  }, [fetchAssets, fetchLibraries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, formData);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/assets', formData);
        toast.success('Asset created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save asset');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const handleConvertToProduct = async (asset) => {
    try {
      await api.post(`/assets/${asset.id}/convert-to-product`);
      toast.success('Asset converted to product successfully');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to convert asset');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      sku: asset.sku,
      description: asset.description || '',
      category: asset.category || '',
      status: asset.status || 'draft',
      color_ids: asset.color_ids || [],
      size_ids: asset.size_ids || [],
      supplier_id: asset.supplier_id || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({ name: '', sku: '', description: '', category: '', status: 'draft' });
  };

  const generateWithAI = async (field) => {
    setAiLoading(true);
    try {
      const response = await api.post('/ai/generate', {
        context: `Asset name: ${formData.name}, Category: ${formData.category}, Current description: ${formData.description}`,
        entity_type: 'asset',
        field_name: field
      });
      if (field === 'description') {
        setFormData({ ...formData, description: response.data.generated });
      } else if (field === 'sku') {
        setFormData({ ...formData, sku: response.data.generated.replace(/[^A-Z0-9-]/gi, '').substring(0, 20).toUpperCase() });
      }
      toast.success('Generated with AI');
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result);
    };
    reader.readAsDataURL(file);

    setUploadDialogOpen(true);
    setAiAnalysisResult(null);
  };

  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    setUploadLoading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(30);

      const response = await api.post('/assets/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total) + 30;
          setUploadProgress(Math.min(progress, 80));
        }
      });

      setUploadProgress(100);
      setAiAnalysisResult(response.data);
      toast.success('Asset created successfully with AI analysis!');
      fetchAssets();
      
      // Close dialog after a moment to show results
      setTimeout(() => {
        setUploadDialogOpen(false);
        setPreviewImage(null);
        setAiAnalysisResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);

    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="assets-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage your design assets</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageSelect}
            data-testid="image-upload-input"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-image-btn"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="create-asset-btn">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-assets-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3,4,5].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No assets found</p>
                    <p className="text-sm text-muted-foreground mt-1">Upload an image to create one with AI</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}>
                    <TableCell>
                      {asset.image_url ? (
                        <img
                          src={asset.image_url}
                          alt={asset.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="font-mono text-sm">{asset.sku}</TableCell>
                    <TableCell>{asset.category || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`asset-menu-${asset.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(asset)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvertToProduct(asset)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Convert to Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(asset.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Image Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        if (!uploadLoading) {
          setUploadDialogOpen(open);
          if (!open) {
            setPreviewImage(null);
            setAiAnalysisResult(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Public_Sans'] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Image Analysis
            </DialogTitle>
            <DialogDescription>
              Upload an image and AI will automatically generate asset attributes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {previewImage && (
              <div className="flex justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-64 rounded-lg object-contain border"
                />
              </div>
            )}

            {uploadLoading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadProgress < 80 ? 'Uploading image...' : 'Analyzing with AI...'}
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {aiAnalysisResult && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Analysis Results
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{aiAnalysisResult.ai_analysis?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{aiAnalysisResult.ai_analysis?.category}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium">{aiAnalysisResult.ai_analysis?.description}</p>
                  </div>
                  {aiAnalysisResult.ai_analysis?.detected_colors?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Colors:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiAnalysisResult.ai_analysis.detected_colors.map((color, i) => (
                          <Badge key={i} variant="outline">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiAnalysisResult.ai_analysis?.materials?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Materials:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiAnalysisResult.ai_analysis.materials.map((mat, i) => (
                          <Badge key={i} variant="outline">{mat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-green-600 font-medium">Asset created successfully!</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploadLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImageUpload}
              disabled={uploadLoading || !previewImage || aiAnalysisResult}
              data-testid="analyze-image-btn"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze & Create Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Public_Sans']">
              {editingAsset ? 'Edit Asset' : 'Create Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingAsset ? 'Update the asset details below.' : 'Fill in the details to create a new asset.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="asset-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="font-mono"
                    data-testid="asset-sku-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => generateWithAI('sku')}
                    disabled={aiLoading || !formData.name}
                    title="Generate SKU with AI"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  data-testid="asset-category-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="asset-status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateWithAI('description')}
                  disabled={aiLoading || !formData.name}
                >
                  <Sparkles className="mr-2 h-3 w-3" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="asset-description-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="asset-submit-btn">
                {editingAsset ? 'Update' : 'Create'} Asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsPage;
