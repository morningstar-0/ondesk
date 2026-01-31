import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import MediaUploadPanel from '../components/MediaUploadPanel';
import { Plus, Search, MoreVertical, Pencil, Trash2, Upload, Layers, Image } from 'lucide-react';

const MaterialsPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      toast.success('Material deleted');
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleUploadComplete = (results) => {
    setUploadPanelOpen(false);
    fetchMaterials();
    toast.success('Material created from image');
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="materials-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Materials Library</h1>
          <p className="text-muted-foreground mt-1">Manage your material catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadPanelOpen(true)} data-testid="upload-material-btn">
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <Button onClick={() => navigate('/materials/new')} data-testid="create-material-btn">
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
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
                <TableHead>Type</TableHead>
                <TableHead>Composition</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No materials found</p>
                    <p className="text-sm text-muted-foreground">Upload an image to create one</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map(material => (
                  <TableRow key={material.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/materials/${material.id}`)}>
                    <TableCell>
                      {material.primary_image_url ? (
                        <img src={material.primary_image_url} alt={material.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{material.code}</TableCell>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.material_type || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{material.composition || '-'}</TableCell>
                    <TableCell>${material.unit_price?.toFixed(2) || '0.00'}/{material.unit}</TableCell>
                    <TableCell>
                      <Badge variant={material.status === 'active' ? 'default' : 'secondary'}>
                        {material.status}
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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/materials/${material.id}`); }}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(material.id); }} className="text-destructive">
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
        entityType="material"
        api={api}
        allowMultiple={false}
      />
    </div>
  );
};

export default MaterialsPage;
