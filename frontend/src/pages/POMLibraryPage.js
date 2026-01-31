import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Ruler, Search, GripVertical } from 'lucide-react';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'accessories', label: 'Accessories' }
];

const units = [
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'mm', label: 'Millimeters (mm)' }
];

const POMLibraryPage = () => {
  const { api } = useAuth();
  const [pomList, setPomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPom, setEditingPom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'general',
    unit: 'cm',
    sort_order: 0
  });

  const fetchPomList = useCallback(async () => {
    try {
      const response = await api.get('/pom');
      setPomList(response.data);
    } catch (error) {
      toast.error('Failed to load POM library');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPomList();
  }, [fetchPomList]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'general',
      unit: 'cm',
      sort_order: pomList.length
    });
    setEditingPom(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (pom) => {
    setFormData({
      name: pom.name,
      code: pom.code,
      description: pom.description || '',
      category: pom.category || 'general',
      unit: pom.unit || 'cm',
      sort_order: pom.sort_order || 0
    });
    setEditingPom(pom);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and Code are required');
      return;
    }

    try {
      if (editingPom) {
        await api.put(`/pom/${editingPom.id}`, formData);
        toast.success('Point of Measurement updated');
      } else {
        await api.post('/pom', formData);
        toast.success('Point of Measurement created');
      }
      setIsDialogOpen(false);
      fetchPomList();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (pom) => {
    if (!window.confirm(`Delete "${pom.name}"?`)) return;
    try {
      await api.delete(`/pom/${pom.id}`);
      toast.success('Deleted');
      fetchPomList();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredList = pomList.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      tops: 'bg-blue-100 text-blue-800',
      bottoms: 'bg-green-100 text-green-800',
      dresses: 'bg-pink-100 text-pink-800',
      outerwear: 'bg-orange-100 text-orange-800',
      footwear: 'bg-purple-100 text-purple-800',
      accessories: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="p-6 space-y-6" data-testid="pom-library-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Public_Sans']">Points of Measurement</h1>
          <p className="text-muted-foreground">Define measurement points for your products</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-pom-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Measurement Point
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredList.length} measurement point{filteredList.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Ruler className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No measurement points found</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={openCreateDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first point
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((pom, index) => (
                  <TableRow key={pom.id} className="group">
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{pom.code}</TableCell>
                    <TableCell className="font-medium">{pom.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getCategoryColor(pom.category)}>
                        {pom.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{pom.unit}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {pom.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(pom)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pom)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPom ? 'Edit Measurement Point' : 'New Measurement Point'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CHEST"
                />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chest Width"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="How to measure this point..."
              />
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPom ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POMLibraryPage;
