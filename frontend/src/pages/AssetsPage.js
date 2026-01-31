import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import { Plus, Search, MoreVertical, Pencil, Trash2, ArrowRightLeft, Upload, Package, Image, ExternalLink } from 'lucide-react';

const AssetsPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);

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

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleConvertToProduct = async (asset, e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/assets/${asset.id}/convert-to-product`);
      toast.success('Converted to product');
      navigate(`/products/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to convert');
    }
  };

  const handleUploadComplete = (results) => {
    setUploadPanelOpen(false);
    fetchAssets();
    if (results.length > 0 && results[0].entity) {
      navigate(`/assets/${results[0].entity.id}`);
    }
  };

  const handleRowClick = (e, assetId) => {
    // Check if Ctrl (Windows) or Cmd (Mac) is pressed
    if (e.ctrlKey || e.metaKey) {
      window.open(`/assets/${assetId}`, '_blank');
    } else {
      navigate(`/assets/${assetId}`);
    }
  };

  const filteredAssets = assets.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="assets-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage your design assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadPanelOpen(true)} data-testid="upload-image-btn">
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <Button onClick={() => navigate('/assets/new')} data-testid="create-asset-btn">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="search-assets-input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No assets found</p>
                    <p className="text-sm text-muted-foreground">Upload an image to create one with AI</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map(asset => (
                  <TableRow 
                    key={asset.id} 
                    className="cursor-pointer hover:bg-muted/50 group"
                    onClick={(e) => handleRowClick(e, asset.id)}
                    data-testid={`asset-row-${asset.id}`}
                  >
                    <TableCell>
                      {asset.primary_image_url ? (
                        <img src={asset.primary_image_url} alt={asset.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{asset.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.name}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click to open</p>
                              <p className="text-xs text-muted-foreground">Ctrl/Cmd + Click for new tab</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>{asset.division_id || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/assets/${asset.id}`); }}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`/assets/${asset.id}`, '_blank'); }}>
                            <ExternalLink className="mr-2 h-4 w-4" />Open in New Tab
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleConvertToProduct(asset, e)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />Convert to Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDelete(asset.id, e)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
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

      <MediaUploadPanel
        isOpen={uploadPanelOpen}
        onClose={() => setUploadPanelOpen(false)}
        onUploadComplete={handleUploadComplete}
        entityType="asset"
        api={api}
        allowMultiple={true}
      />
    </div>
  );
};

export default AssetsPage;
