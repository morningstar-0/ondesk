import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Plus, Trash2, Package, Calculator, ChevronDown, ChevronRight, 
  Search, Image, Filter, Check, X
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
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedSections, setExpandedSections] = useState(['fabric', 'hardware']);
  const [filterColor, setFilterColor] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const inputRefs = useRef({});

  const addNewRow = (sectionId) => {
    const newItem = {
      id: `bom-${Date.now()}`,
      section: sectionId,
      part_name: '',
      material_id: '',
      material_code: '',
      material_name: '',
      placement: '',
      usage: 'All',
      color_id: '',
      color_name: '',
      size_id: '',
      size_name: '',
      quantity: 1,
      unit: 'meter',
      unit_cost: 0,
      total_cost: 0,
      notes: '',
      isNew: true
    };
    onChange([...bom, newItem]);
    setEditingId(newItem.id);
    
    // Ensure section is expanded
    if (!expandedSections.includes(sectionId)) {
      setExpandedSections([...expandedSections, sectionId]);
    }
    
    // Focus on first input after render
    setTimeout(() => {
      if (inputRefs.current[`${newItem.id}-material`]) {
        inputRefs.current[`${newItem.id}-material`].focus();
      }
    }, 100);
  };

  const updateItem = (itemId, field, value) => {
    const updatedBom = bom.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // If material is selected, update related fields
        if (field === 'material_id') {
          const material = materials.find(m => m.id === value);
          if (material) {
            updatedItem.material_code = material.code;
            updatedItem.material_name = material.name;
            updatedItem.unit_cost = material.unit_price || 0;
            updatedItem.total_cost = (material.unit_price || 0) * (updatedItem.quantity || 1);
            if (!updatedItem.part_name) {
              updatedItem.part_name = material.name;
            }
          }
        }
        
        // If color is selected, update color name
        if (field === 'color_id') {
          const color = colors.find(c => c.id === value);
          updatedItem.color_name = color?.name || '';
        }
        
        // If size is selected, update size name
        if (field === 'size_id') {
          const size = sizes.find(s => s.id === value);
          updatedItem.size_name = size?.name || '';
        }
        
        // Recalculate total cost when quantity changes
        if (field === 'quantity') {
          updatedItem.total_cost = updatedItem.unit_cost * (parseFloat(value) || 0);
        }
        
        return updatedItem;
      }
      return item;
    });
    onChange(updatedBom);
  };

  const confirmRow = (itemId) => {
    const item = bom.find(i => i.id === itemId);
    if (item && !item.material_id) {
      // Remove row if no material selected
      onChange(bom.filter(i => i.id !== itemId));
    } else {
      // Mark as confirmed (remove isNew flag)
      const updatedBom = bom.map(i => 
        i.id === itemId ? { ...i, isNew: false } : i
      );
      onChange(updatedBom);
    }
    setEditingId(null);
  };

  const cancelRow = (itemId) => {
    const item = bom.find(i => i.id === itemId);
    if (item?.isNew) {
      onChange(bom.filter(i => i.id !== itemId));
    }
    setEditingId(null);
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

  const handleKeyDown = (e, itemId, field) => {
    if (e.key === 'Enter') {
      confirmRow(itemId);
    } else if (e.key === 'Escape') {
      cancelRow(itemId);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Allow natural tab navigation
    }
  };

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
          const sectionItemIds = sectionItems.filter(i => !i.isNew).map(i => i.id);
          const allSelected = sectionItemIds.length > 0 && sectionItemIds.every(id => selectedItems.includes(id));

          return (
            <div key={section.id} className="border-b last:border-b-0">
              {/* Section Header */}
              <div 
                className="flex items-center justify-between px-4 py-2.5 bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
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
                    {sectionItems.filter(i => !i.isNew).length}
                  </Badge>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs"
                      onClick={() => addNewRow(section.id)}
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
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wider">
                          <th className="w-10 px-3 py-2 text-left">
                            <Checkbox 
                              checked={allSelected}
                              onCheckedChange={() => toggleAllInSection(section.id, sectionItems.filter(i => !i.isNew))}
                            />
                          </th>
                          <th className="min-w-[140px] px-2 py-2 text-left">Material</th>
                          <th className="min-w-[100px] px-2 py-2 text-left">Part Name</th>
                          <th className="min-w-[100px] px-2 py-2 text-left">Placement</th>
                          <th className="w-20 px-2 py-2 text-left">Usage</th>
                          <th className="w-24 px-2 py-2 text-left">Color</th>
                          <th className="w-20 px-2 py-2 text-left">Size</th>
                          <th className="w-16 px-2 py-2 text-right">Qty</th>
                          <th className="w-20 px-2 py-2 text-left">Unit</th>
                          <th className="w-20 px-2 py-2 text-right">Cost</th>
                          <th className="w-16 px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {sectionItems.map((item, idx) => {
                          const isEditing = editingId === item.id || item.isNew;
                          
                          return (
                            <tr 
                              key={item.id}
                              className={`border-b border-slate-100 transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                              } ${selectedItems.includes(item.id) ? 'bg-blue-50' : ''} ${
                                isEditing ? 'bg-yellow-50' : 'hover:bg-blue-50/50'
                              }`}
                              onDoubleClick={() => !readOnly && setEditingId(item.id)}
                            >
                              <td className="w-10 px-3 py-1" onClick={(e) => e.stopPropagation()}>
                                {!item.isNew && (
                                  <Checkbox 
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={() => toggleItemSelection(item.id)}
                                  />
                                )}
                              </td>
                              
                              {/* Material Select */}
                              <td className="min-w-[140px] px-2 py-1">
                                {isEditing ? (
                                  <Select
                                    value={item.material_id || '__none__'}
                                    onValueChange={(v) => updateItem(item.id, 'material_id', v === '__none__' ? '' : v)}
                                  >
                                    <SelectTrigger 
                                      ref={el => inputRefs.current[`${item.id}-material`] = el}
                                      className="h-8 text-xs"
                                    >
                                      <SelectValue placeholder="Select material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">Select...</SelectItem>
                                      {materials.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                          <span className="font-mono text-xs mr-2">{m.code}</span>
                                          {m.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs text-slate-500">{item.material_code}</span>
                                    <span className="text-sm truncate">{item.material_name}</span>
                                  </div>
                                )}
                              </td>
                              
                              {/* Part Name */}
                              <td className="min-w-[100px] px-2 py-1">
                                {isEditing ? (
                                  <Input
                                    value={item.part_name || ''}
                                    onChange={(e) => updateItem(item.id, 'part_name', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, item.id, 'part_name')}
                                    className="h-8 text-xs"
                                    placeholder="Part name"
                                  />
                                ) : (
                                  <span className="text-sm">{item.part_name || '-'}</span>
                                )}
                              </td>
                              
                              {/* Placement */}
                              <td className="min-w-[100px] px-2 py-1">
                                {isEditing ? (
                                  <Input
                                    value={item.placement || ''}
                                    onChange={(e) => updateItem(item.id, 'placement', e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, item.id, 'placement')}
                                    className="h-8 text-xs"
                                    placeholder="Placement"
                                  />
                                ) : (
                                  <span className="text-sm text-slate-600">{item.placement || '-'}</span>
                                )}
                              </td>
                              
                              {/* Usage */}
                              <td className="w-20 px-2 py-1">
                                {isEditing ? (
                                  <Select
                                    value={item.usage || 'All'}
                                    onValueChange={(v) => updateItem(item.id, 'usage', v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="All">All</SelectItem>
                                      <SelectItem value="Self">Self</SelectItem>
                                      <SelectItem value="Contrast">Contrast</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-sm text-slate-600">{item.usage || 'All'}</span>
                                )}
                              </td>
                              
                              {/* Color */}
                              <td className="w-24 px-2 py-1">
                                {isEditing ? (
                                  <Select
                                    value={item.color_id || '__none__'}
                                    onValueChange={(v) => updateItem(item.id, 'color_id', v === '__none__' ? '' : v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">None</SelectItem>
                                      {colors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-sm text-slate-600">{item.color_name || '-'}</span>
                                )}
                              </td>
                              
                              {/* Size */}
                              <td className="w-20 px-2 py-1">
                                {isEditing ? (
                                  <Select
                                    value={item.size_id || '__none__'}
                                    onValueChange={(v) => updateItem(item.id, 'size_id', v === '__none__' ? '' : v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">None</SelectItem>
                                      {sizes.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-sm text-slate-600">{item.size_name || '-'}</span>
                                )}
                              </td>
                              
                              {/* Quantity */}
                              <td className="w-16 px-2 py-1 text-right">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.quantity || ''}
                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => handleKeyDown(e, item.id, 'quantity')}
                                    className="h-8 text-xs text-right w-16"
                                  />
                                ) : (
                                  <span className="font-mono text-sm">{item.quantity}</span>
                                )}
                              </td>
                              
                              {/* Unit */}
                              <td className="w-20 px-2 py-1">
                                {isEditing ? (
                                  <Select
                                    value={item.unit || 'meter'}
                                    onValueChange={(v) => updateItem(item.id, 'unit', v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {units.map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                                )}
                              </td>
                              
                              {/* Cost */}
                              <td className="w-20 px-2 py-1 text-right">
                                <span className="font-mono text-sm font-medium">
                                  ${(item.total_cost || 0).toFixed(2)}
                                </span>
                              </td>
                              
                              {/* Actions */}
                              <td className="w-16 px-2 py-1">
                                <div className="flex items-center justify-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => confirmRow(item.id)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                        onClick={() => cancelRow(item.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-400 hover:text-red-500"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
            {bom.filter(i => !i.isNew).length} item{bom.filter(i => !i.isNew).length !== 1 ? 's' : ''} total
            <span className="text-xs text-slate-400 ml-2">
              (Double-click row to edit • Enter to confirm • Esc to cancel)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Total Cost:</span>
            <span className="font-mono font-semibold text-lg">${totalBomCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BOMPanel;
