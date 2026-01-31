import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Palette } from 'lucide-react';

const ColorsLibraryPage = () => {
  const { api } = useAuth();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [formData, setFormData] = useState({ name: '', hex_code: '#000000', description: '' });

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const response = await api.get('/colors');
      setColors(response.data);
    } catch (error) {
      toast.error('Failed to fetch colors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingColor) {
        await api.put(`/colors/${editingColor.id}`, formData);
        toast.success('Color updated');
      } else {
        await api.post('/colors', formData);
        toast.success('Color created');
      }
      setDialogOpen(false);
      resetForm();
      fetchColors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save color');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this color?')) return;
    try {
      await api.delete(`/colors/${id}`);
      toast.success('Color deleted');
      fetchColors();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (color) => {
    setEditingColor(color);
    setFormData({ name: color.name, hex_code: color.hex_code, description: color.description || '' });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingColor(null);
    setFormData({ name: '', hex_code: '#000000', description: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="colors-library-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Colors Library</h1>
          <p className="text-muted-foreground mt-1">Manage your color palette</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="create-color-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Color
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Hex Code</TableHead>
                <TableHead>Description</TableHead>
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
              ) : colors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Palette className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No colors yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                colors.map((color) => (
                  <TableRow key={color.id}>
                    <TableCell>
                      <div 
                        className="w-8 h-8 rounded-md border shadow-sm" 
                        style={{ backgroundColor: color.hex_code }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{color.name}</TableCell>
                    <TableCell className="font-mono text-sm uppercase">{color.hex_code}</TableCell>
                    <TableCell className="text-muted-foreground">{color.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(color)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(color.id)}>
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
            <DialogTitle>{editingColor ? 'Edit Color' : 'Add Color'}</DialogTitle>
            <DialogDescription>Define a color for your palette.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="color-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hex_code">Hex Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="hex_code"
                  type="color"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  className="font-mono uppercase"
                  data-testid="color-hex-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="color-description-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="color-submit-btn">{editingColor ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColorsLibraryPage;
