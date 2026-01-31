import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
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
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react';

const SizesLibraryPage = () => {
  const { api } = useAuth();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', category: 'general', sort_order: 0 });

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await api.get('/sizes');
      setSizes(response.data);
    } catch (error) {
      toast.error('Failed to fetch sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSize) {
        await api.put(`/sizes/${editingSize.id}`, formData);
        toast.success('Size updated');
      } else {
        await api.post('/sizes', formData);
        toast.success('Size created');
      }
      setDialogOpen(false);
      resetForm();
      fetchSizes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this size?')) return;
    try {
      await api.delete(`/sizes/${id}`);
      toast.success('Size deleted');
      fetchSizes();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (size) => {
    setEditingSize(size);
    setFormData({ name: size.name, code: size.code, category: size.category, sort_order: size.sort_order });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSize(null);
    setFormData({ name: '', code: '', category: 'general', sort_order: 0 });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="sizes-library-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Sizes Library</h1>
          <p className="text-muted-foreground mt-1">Manage size definitions</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="create-size-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Size
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : sizes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Ruler className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No sizes yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell className="font-medium">{size.name}</TableCell>
                    <TableCell className="font-mono">{size.code}</TableCell>
                    <TableCell>{size.category}</TableCell>
                    <TableCell>{size.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(size)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(size.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSize ? 'Edit Size' : 'Add Size'}</DialogTitle>
            <DialogDescription>Define a size option.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Small"
                  data-testid="size-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., S"
                  className="font-mono"
                  data-testid="size-code-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., apparel"
                  data-testid="size-category-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  data-testid="size-sort-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="size-submit-btn">{editingSize ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SizesLibraryPage;
