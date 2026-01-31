import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText, X } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'textarea', label: 'Long Text' },
];

const CustomFieldsLibraryPage = () => {
  const { api } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: '', field_type: 'text', options: [], required: false, default_value: '', category: 'general'
  });
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await api.get('/custom-fields');
      setFields(response.data);
    } catch (error) {
      toast.error('Failed to fetch custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingField) {
        await api.put(`/custom-fields/${editingField.id}`, formData);
        toast.success('Field updated');
      } else {
        await api.post('/custom-fields', formData);
        toast.success('Field created');
      }
      setDialogOpen(false);
      resetForm();
      fetchFields();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this field?')) return;
    try {
      await api.delete(`/custom-fields/${id}`);
      toast.success('Field deleted');
      fetchFields();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      field_type: field.field_type,
      options: field.options || [],
      required: field.required,
      default_value: field.default_value || '',
      category: field.category || 'general'
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingField(null);
    setFormData({ name: '', field_type: 'text', options: [], required: false, default_value: '', category: 'general' });
    setNewOption('');
  };

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData({ ...formData, options: [...formData.options, newOption.trim()] });
      setNewOption('');
    }
  };

  const removeOption = (opt) => {
    setFormData({ ...formData, options: formData.options.filter(o => o !== opt) });
  };

  const showOptions = ['select', 'multiselect'].includes(formData.field_type);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="custom-fields-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Custom Fields Library</h1>
          <p className="text-muted-foreground mt-1">Define reusable custom fields for assets and products</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="create-field-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Required</TableHead>
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
              ) : fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No custom fields yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}</Badge>
                    </TableCell>
                    <TableCell>{field.category}</TableCell>
                    <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(field)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(field.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
            <DialogDescription>Configure a reusable field definition.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="field-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field_type">Field Type *</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value) => setFormData({ ...formData, field_type: value })}
                >
                  <SelectTrigger data-testid="field-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., product, asset"
                  data-testid="field-category-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_value">Default Value</Label>
                <Input
                  id="default_value"
                  value={formData.default_value}
                  onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                  data-testid="field-default-input"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
              <Label htmlFor="required">Required field</Label>
            </div>

            {showOptions && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    data-testid="field-option-input"
                  />
                  <Button type="button" variant="outline" onClick={addOption}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.options.map((opt, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {opt}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeOption(opt)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="field-submit-btn">{editingField ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomFieldsLibraryPage;
