import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Plus, Trash2, Package, Calculator, ChevronDown, ChevronRight, 
  Search, Image, FileText, ExternalLink, Filter
} from 'lucide-react';

const units = ['meter', 'yard', 'kg', 'lb', 'piece', 'roll', 'sheet', 'sqm', 'sqft'];

const bomSections = [
  { id: 'fabric', name: 'FABRIC', color: 'bg-blue-500' },
  { id: 'hardware', name: 'HARDWARE/TRIMS', color: 'bg-orange-500' },
  { id: 'packaging', name: 'PACKAGING', color: 'bg-green-500' },
  { id: 'labels', name: 'LABELS', color: 'bg-purple-500' },
  { id: 'other', name: 'OTHER', color: 'bg-gray-500' }
];

const BOMPanel = ({ 
  bom = [], 
  onChange, 
  materials = [], 
  colors = [],
  sizes = [],
  readOnly = false 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedSections, setExpandedSections] = useState(['fabric', 'hardware']);
  const [filterColor, setFilterColor] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [formData, setFormData] = useState({
    section: 'fabric',
    part_name: '',
    material_id: '',
    placement: '',
    usage: 'All',
    color_id: '',
    size_id: '',
    quantity: 1,
    unit: 'meter',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      section: 'fabric',
      part_name: '',
      material_id: '',
      placement: '',
      usage: 'All',
      color_id: '',
      size_id: '',
      quantity: 1,
      unit: 'meter',
      notes: ''
    });
    setEditingItem(null);
  };

  const openAddDialog = (sectionId = 'fabric') => {
    resetForm();
    setFormData(prev => ({ ...prev, section: sectionId }));
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setFormData({
      section: item.section || 'fabric',
      part_name: item.part_name || '',
      material_id: item.material_id,
      placement: item.placement || '',
      usage: item.usage || 'All',
      color_id: item.color_id || '',
      size_id: item.size_id || '',
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes || ''
    });
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    const selectedMaterial = materials.find(m => m.id === formData.material_id);
    if (!selectedMaterial) return;

    const selectedColor = colors.find(c => c.id === formData.color_id);
    const selectedSize = sizes.find(s => s.id === formData.size_id);
    const unitCost = selectedMaterial.unit_price || 0;
    const totalCost = unitCost * formData.quantity;

    const newItem = {
      id: editingItem?.id || `bom-${Date.now()}`,
      section: formData.section,
      part_name: formData.part_name || selectedMaterial.name,
      material_id: formData.material_id,
      material_code: selectedMaterial.code,
      material_name: selectedMaterial.name,
      placement: formData.placement,
      usage: formData.usage,
      color_id: formData.color_id,
      color_name: selectedColor?.name || '',
      size_id: formData.size_id,
      size_name: selectedSize?.name || '',
      quantity: formData.quantity,
      unit: formData.unit,
      unit_cost: unitCost,
      total_cost: totalCost,
      notes: formData.notes
    };

    let updatedBom;
    if (editingItem) {
      updatedBom = bom.map(item => item.id === editingItem.id ? newItem : item);
    } else {
      updatedBom = [...bom, newItem];
    }

    onChange(updatedBom);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = (itemIds) => {
    const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
    onChange(bom.filter(item => !ids.includes(item.id)));
    setSelectedItems(selectedItems.filter(id => !ids.includes(id)));
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAllInSection = (sectionId, items) => {
    const sectionItemIds = items.map(i => i.id);
    const allSelected = sectionItemIds.every(id => selectedItems.includes(id));
    
    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !sectionItemIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...sectionItemIds])]);
    }
  };

  // Filter and group BOM items by section
  const getFilteredItems = () => {
    return bom.filter(item => {
      if (filterColor !== 'all' && item.color_id !== filterColor) return false;
      if (filterSize !== 'all' && item.size_id !== filterSize) return false;
      return true;
    });
  };

  const groupedItems = bomSections.reduce((acc, section) => {
    acc[section.id] = getFilteredItems().filter(item => (item.section || 'fabric') === section.id);
    return acc;
  }, {});

  const totalBomCost = bom.reduce((sum, item) => sum + (item.total_cost || 0), 0);

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      {/* Header */}
      <CardHeader className="pb-3 bg-slate-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            Bill of Materials
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={filterColor} onValueChange={setFilterColor}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {colors.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger className="h-8 w-[100px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {sizes.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Sections */}
        {bomSections.map(section => {
          const sectionItems = groupedItems[section.id] || [];
          const isExpanded = expandedSections.includes(section.id);
          const sectionItemIds = sectionItems.map(i => i.id);
          const allSelected = sectionItemIds.length > 0 && sectionItemIds.every(id => selectedItems.includes(id));

          return (
            <div key={section.id} className="border-b last:border-b-0">
              {/* Section Header */}
              <div 
                className={`flex items-center justify-between px-4 py-2.5 bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                  <div className={`w-1 h-5 rounded-full ${section.color}`} />
                  <span className="font-semibold text-sm text-slate-700 tracking-wide">
                    {section.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {sectionItems.length}
                  </Badge>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs"
                      onClick={() => openAddDialog(section.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New
                    </Button>
                    {selectedItems.some(id => sectionItemIds.includes(id)) && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(selectedItems.filter(id => sectionItemIds.includes(id)))}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  {sectionItems.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      No items in this section
                    </div>
                  ) : (
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wider">
                          <th className="w-10 px-3 py-2 text-left">
                            <Checkbox 
                              checked={allSelected}
                              onCheckedChange={() => toggleAllInSection(section.id, sectionItems)}
                            />
                          </th>
                          <th className="w-10 px-2 py-2" />
                          <th className="min-w-[100px] px-3 py-2 text-left">Part</th>
                          <th className="min-w-[100px] px-3 py-2 text-left">Material Code</th>
                          <th className="min-w-[140px] px-3 py-2 text-left">Material Name</th>
                          <th className="min-w-[120px] px-3 py-2 text-left">Placement</th>
                          <th className="w-16 px-3 py-2 text-left">Usage</th>
                          <th className="w-24 px-3 py-2 text-left">Color</th>
                          <th className="w-16 px-3 py-2 text-left">Size</th>
                          <th className="w-16 px-3 py-2 text-right">Qty</th>
                          <th className="min-w-[100px] px-3 py-2 text-left">Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionItems.map((item, idx) => (
                          <tr 
                            key={item.id}
                            className={`border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                            } ${selectedItems.includes(item.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => !readOnly && openEditDialog(item)}
                          >
                            <td className="w-10 px-3 py-2" onClick={(e) => e.stopPropagation()}>
                              <Checkbox 
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                              />
                            </td>
                            <td className="w-10 px-2 py-2">
                              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
                                <Image className="h-4 w-4 text-slate-400" />
                              </div>
                            </td>
                            <td className="min-w-[100px] px-3 py-2">
                              <span className="font-medium text-sm text-slate-800">
                                {item.part_name || item.material_name}
                              </span>
                            </td>
                            <td className="min-w-[100px] px-3 py-2">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-slate-600">{item.material_code}</span>
                                <Search className="h-3 w-3 text-slate-400" />
                              </div>
                            </td>
                            <td className="min-w-[140px] px-3 py-2">
                              <span className="text-sm text-slate-700">{item.material_name}</span>
                            </td>
                            <td className="min-w-[120px] px-3 py-2">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-600 truncate max-w-[100px]">
                                  {item.placement || '-'}
                                </span>
                                {item.placement && <ChevronRight className="h-3 w-3 text-slate-400" />}
                              </div>
                            </td>
                            <td className="w-16 px-3 py-2">
                              <span className="text-sm text-slate-600">{item.usage || 'All'}</span>
                            </td>
                            <td className="w-24 px-3 py-2">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-600 truncate max-w-[70px]">
                                  {item.color_name || '-'}
                                </span>
                                {item.color_name && <ChevronRight className="h-3 w-3 text-slate-400" />}
                              </div>
                            </td>
                            <td className="w-16 px-3 py-2">
                              <span className="text-sm text-slate-600">{item.size_name || 'None'}</span>
                            </td>
                            <td className="w-16 px-3 py-2 text-right">
                              <span className="font-mono text-sm">{item.quantity}</span>
                            </td>
                            <td className="min-w-[100px] px-3 py-2">
                              <span className="text-sm text-slate-600 truncate">
                                {materials.find(m => m.id === item.material_id)?.supplier || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Footer with totals */}
        <div className="px-4 py-3 bg-slate-100 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {bom.length} item{bom.length !== 1 ? 's' : ''} total
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Total Cost:</span>
            <span className="font-mono font-semibold text-lg">${totalBomCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit BOM Item' : 'Add Material to BOM'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(v) => setFormData({ ...formData, section: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bomSections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Part Name</Label>
                <Input
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  placeholder="e.g., Main Fabric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Material *</Label>
              <Select
                value={formData.material_id}
                onValueChange={(value) => {
                  const material = materials.find(m => m.id === value);
                  setFormData({ 
                    ...formData, 
                    material_id: value,
                    unit: material?.unit || formData.unit
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{material.code}</span>
                        <span>{material.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Placement</Label>
              <Input
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                placeholder="e.g., Front Panel, Sleeves"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color_id || '__none__'}
                  onValueChange={(v) => setFormData({ ...formData, color_id: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {colors.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Select
                  value={formData.size_id || '__none__'}
                  onValueChange={(v) => setFormData({ ...formData, size_id: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {sizes.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Usage</Label>
                <Select
                  value={formData.usage}
                  onValueChange={(v) => setFormData({ ...formData, usage: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Self">Self</SelectItem>
                    <SelectItem value="Contrast">Contrast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes..."
              />
            </div>

            {/* Cost Preview */}
            {formData.material_id && (
              <div className="rounded-lg bg-slate-100 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Estimated Cost:</span>
                  <span className="font-mono font-semibold text-lg">
                    ${(
                      (materials.find(m => m.id === formData.material_id)?.unit_price || 0) * 
                      formData.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.material_id || formData.quantity <= 0}>
              {editingItem ? 'Update' : 'Add to BOM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BOMPanel;
