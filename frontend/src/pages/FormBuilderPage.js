import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText, Layers, GripVertical, X } from 'lucide-react';

const FormBuilderPage = () => {
  const { api } = useAuth();
  const [layouts, setLayouts] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    entity_type: 'asset',
    layout: { sections: [] },
    is_default: false
  });

  useEffect(() => {
    fetchLayouts();
    fetchCustomFields();
  }, []);

  const fetchLayouts = async () => {
    try {
      const response = await api.get('/form-layouts');
      setLayouts(response.data);
    } catch (error) {
      toast.error('Failed to fetch layouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const response = await api.get('/custom-fields');
      setCustomFields(response.data);
    } catch (error) {
      console.error('Failed to fetch custom fields:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLayout) {
        await api.put(`/form-layouts/${editingLayout.id}`, formData);
        toast.success('Layout updated');
      } else {
        await api.post('/form-layouts', formData);
        toast.success('Layout created');
      }
      setDialogOpen(false);
      resetForm();
      fetchLayouts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this layout?')) return;
    try {
      await api.delete(`/form-layouts/${id}`);
      toast.success('Layout deleted');
      fetchLayouts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (layout) => {
    setEditingLayout(layout);
    setFormData({
      name: layout.name,
      entity_type: layout.entity_type,
      layout: layout.layout || { sections: [] },
      is_default: layout.is_default
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLayout(null);
    setFormData({
      name: '',
      entity_type: 'asset',
      layout: { sections: [] },
      is_default: false
    });
  };

  const addSection = () => {
    setFormData({
      ...formData,
      layout: {
        ...formData.layout,
        sections: [...(formData.layout.sections || []), { name: 'New Section', fields: [] }]
      }
    });
  };

  const updateSection = (index, section) => {
    const sections = [...formData.layout.sections];
    sections[index] = section;
    setFormData({ ...formData, layout: { ...formData.layout, sections } });
  };

  const removeSection = (index) => {
    const sections = formData.layout.sections.filter((_, i) => i !== index);
    setFormData({ ...formData, layout: { ...formData.layout, sections } });
  };

  const addFieldToSection = (sectionIndex, fieldId) => {
    const sections = [...formData.layout.sections];
    const field = customFields.find(f => f.id === fieldId);
    if (field && !sections[sectionIndex].fields.find(f => f.id === fieldId)) {
      sections[sectionIndex].fields.push({ id: fieldId, name: field.name, type: field.field_type });
      setFormData({ ...formData, layout: { ...formData.layout, sections } });
    }
  };

  const removeFieldFromSection = (sectionIndex, fieldId) => {
    const sections = [...formData.layout.sections];
    sections[sectionIndex].fields = sections[sectionIndex].fields.filter(f => f.id !== fieldId);
    setFormData({ ...formData, layout: { ...formData.layout, sections } });
  };

  const assetLayouts = layouts.filter(l => l.entity_type === 'asset');
  const productLayouts = layouts.filter(l => l.entity_type === 'product');

  return (
    <div className="space-y-6 animate-fade-in" data-testid="form-builder-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Form Builder</h1>
          <p className="text-muted-foreground mt-1">Design custom layouts for assets and products</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="create-layout-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Layout
        </Button>
      </div>

      <Tabs defaultValue="asset" className="space-y-4">
        <TabsList>
          <TabsTrigger value="asset">Asset Layouts ({assetLayouts.length})</TabsTrigger>
          <TabsTrigger value="product">Product Layouts ({productLayouts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="asset">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : assetLayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No asset layouts yet</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assetLayouts.map((layout) => (
                      <TableRow key={layout.id}>
                        <TableCell className="font-medium">{layout.name}</TableCell>
                        <TableCell>{layout.layout?.sections?.length || 0} sections</TableCell>
                        <TableCell>
                          {layout.is_default && <Badge>Default</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(layout)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(layout.id)}>
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
        </TabsContent>

        <TabsContent value="product">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : productLayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No product layouts yet</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    productLayouts.map((layout) => (
                      <TableRow key={layout.id}>
                        <TableCell className="font-medium">{layout.name}</TableCell>
                        <TableCell>{layout.layout?.sections?.length || 0} sections</TableCell>
                        <TableCell>
                          {layout.is_default && <Badge>Default</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(layout)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(layout.id)}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLayout ? 'Edit Layout' : 'Create Form Layout'}</DialogTitle>
            <DialogDescription>Design a form layout with custom sections and fields.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Layout Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="layout-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                >
                  <SelectTrigger data-testid="entity-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">Set as default layout</Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Form Sections</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Section
                </Button>
              </div>

              {(formData.layout.sections || []).map((section, sectionIndex) => (
                <Card key={sectionIndex} className="bg-muted/50">
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(sectionIndex, { ...section, name: e.target.value })}
                        className="flex-1 h-8"
                        placeholder="Section name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeSection(sectionIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {section.fields.map((field) => (
                        <Badge key={field.id} variant="secondary" className="gap-1">
                          {field.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeFieldFromSection(sectionIndex, field.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={(value) => addFieldToSection(sectionIndex, value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Add field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customFields
                          .filter(f => !section.fields.find(sf => sf.id === f.id))
                          .map(field => (
                            <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}

              {(formData.layout.sections || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No sections added yet</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="layout-submit-btn">{editingLayout ? 'Update' : 'Create'} Layout</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilderPage;
