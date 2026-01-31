import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Trash2, Package, Calculator, Pencil } from 'lucide-react';

const units = ['meter', 'yard', 'kg', 'lb', 'piece', 'roll', 'sheet', 'sqm', 'sqft'];

const BOMPanel = ({ bom = [], onChange, materials = [], readOnly = false }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    material_id: '',
    quantity: 1,
    unit: 'meter',
    notes: ''
  });
  const [activeCell, setActiveCell] = useState(null);
  const inputRefs = useRef({});

  const resetForm = () => {
    setFormData({
      material_id: '',
      quantity: 1,
      unit: 'meter',
      notes: ''
    });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setFormData({
      material_id: item.material_id,
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

    const unitCost = selectedMaterial.unit_price || 0;
    const totalCost = unitCost * formData.quantity;

    const newItem = {
      id: editingItem?.id || `bom-${Date.now()}`,
      material_id: formData.material_id,
      material_code: selectedMaterial.code,
      material_name: selectedMaterial.name,
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

  const handleDelete = (itemId, e) => {
    e?.stopPropagation();
    onChange(bom.filter(item => item.id !== itemId));
  };

  const handleInlineQuantityChange = (itemId, newQty) => {
    const updatedBom = bom.map(item => {
      if (item.id === itemId) {
        const quantity = parseFloat(newQty) || 0;
        return {
          ...item,
          quantity,
          total_cost: item.unit_cost * quantity
        };
      }
      return item;
    });
    onChange(updatedBom);
  };

  const handleKeyDown = (e, rowIndex, itemId) => {
    if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      const prevItem = bom[rowIndex - 1];
      inputRefs.current[prevItem.id]?.focus();
      inputRefs.current[prevItem.id]?.select();
    } else if (e.key === 'ArrowDown' && rowIndex < bom.length - 1) {
      e.preventDefault();
      const nextItem = bom[rowIndex + 1];
      inputRefs.current[nextItem.id]?.focus();
      inputRefs.current[nextItem.id]?.select();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex < bom.length - 1) {
        const nextItem = bom[rowIndex + 1];
        inputRefs.current[nextItem.id]?.focus();
        inputRefs.current[nextItem.id]?.select();
      }
    }
  };

  const totalBomCost = bom.reduce((sum, item) => sum + (item.total_cost || 0), 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bill of Materials
          </CardTitle>
          {!readOnly && (
            <Button size="sm" onClick={openAddDialog} disabled={materials.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ag-grid-wrapper">
          {/* AG Grid-like header */}
          <div className="ag-header">
            <div className="ag-header-row">
              <div className="ag-header-cell ag-header-cell-material">Material</div>
              <div className="ag-header-cell ag-header-cell-qty">Qty</div>
              <div className="ag-header-cell ag-header-cell-unit">Unit</div>
              <div className="ag-header-cell ag-header-cell-cost">Unit Cost</div>
              <div className="ag-header-cell ag-header-cell-total">Total</div>
              {!readOnly && <div className="ag-header-cell ag-header-cell-actions" />}
            </div>
          </div>

          {/* AG Grid-like body */}
          <div className="ag-body">
            {bom.length === 0 ? (
              <div className="ag-row ag-row-empty">
                <div className="p-8 text-center w-full">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No materials added</p>
                  {materials.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add materials to your library first
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {bom.map((item, rowIndex) => (
                  <div 
                    key={item.id} 
                    className={`ag-row ${rowIndex % 2 === 0 ? 'ag-row-even' : 'ag-row-odd'} ${!readOnly ? 'cursor-pointer' : ''}`}
                  >
                    <div className="ag-cell ag-cell-material" onClick={() => !readOnly && openEditDialog(item)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.material_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.material_code}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className={`ag-cell ag-cell-qty ${activeCell === item.id ? 'ag-cell-active' : ''}`}>
                      {readOnly ? (
                        <span className="font-mono">{item.quantity}</span>
                      ) : (
                        <Input
                          ref={(el) => { inputRefs.current[item.id] = el; }}
                          type="number"
                          min="0"
                          step="0.01"
                          className="ag-cell-input"
                          value={item.quantity}
                          onChange={(e) => handleInlineQuantityChange(item.id, e.target.value)}
                          onFocus={() => setActiveCell(item.id)}
                          onBlur={() => setActiveCell(null)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, item.id)}
                        />
                      )}
                    </div>
                    <div className="ag-cell ag-cell-unit">
                      <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                    </div>
                    <div className="ag-cell ag-cell-cost">
                      <span className="font-mono text-sm">${item.unit_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="ag-cell ag-cell-total">
                      <span className="font-mono font-medium">${item.total_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    {!readOnly && (
                      <div className="ag-cell ag-cell-actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 mr-1"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleDelete(item.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Total Row */}
                <div className="ag-row ag-row-total">
                  <div className="ag-cell ag-cell-material" />
                  <div className="ag-cell ag-cell-qty" />
                  <div className="ag-cell ag-cell-unit" />
                  <div className="ag-cell ag-cell-cost">
                    <div className="flex items-center gap-2 font-medium">
                      <Calculator className="h-4 w-4" />
                      Total
                    </div>
                  </div>
                  <div className="ag-cell ag-cell-total">
                    <span className="font-mono font-bold text-lg">${totalBomCost.toFixed(2)}</span>
                  </div>
                  {!readOnly && <div className="ag-cell ag-cell-actions" />}
                </div>
              </>
            )}
          </div>
        </div>

        {bom.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            Use arrow keys to navigate • Edit quantity inline • Click row to edit details
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit BOM Item' : 'Add Material to BOM'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                        <span>{material.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ({material.code})
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          ${material.unit_price?.toFixed(2) || '0.00'}/{material.unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Cost:</span>
                  <span className="font-mono font-medium text-lg">
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

      <style jsx>{`
        .ag-grid-wrapper {
          font-size: 13px;
        }
        .ag-header {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          font-weight: 600;
        }
        .ag-header-row {
          display: flex;
          height: 40px;
        }
        .ag-header-cell {
          display: flex;
          align-items: center;
          padding: 0 12px;
          border-right: 1px solid hsl(var(--border));
        }
        .ag-header-cell-material {
          flex: 2;
          min-width: 200px;
        }
        .ag-header-cell-qty {
          width: 100px;
          justify-content: center;
        }
        .ag-header-cell-unit {
          width: 80px;
          justify-content: center;
        }
        .ag-header-cell-cost {
          width: 100px;
          justify-content: flex-end;
        }
        .ag-header-cell-total {
          width: 100px;
          justify-content: flex-end;
        }
        .ag-header-cell-actions {
          width: 80px;
        }
        .ag-body {
          overflow-x: auto;
        }
        .ag-row {
          display: flex;
          min-height: 48px;
          border-bottom: 1px solid hsl(var(--border));
          transition: background 0.1s;
        }
        .ag-row-even {
          background: hsl(var(--background));
        }
        .ag-row-odd {
          background: hsl(var(--muted) / 0.3);
        }
        .ag-row:hover:not(.ag-row-total):not(.ag-row-empty) {
          background: hsl(var(--accent));
        }
        .ag-row-total {
          background: hsl(var(--muted) / 0.5);
          font-weight: 600;
        }
        .ag-row-empty {
          justify-content: center;
        }
        .ag-cell {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-right: 1px solid hsl(var(--border) / 0.5);
        }
        .ag-cell-material {
          flex: 2;
          min-width: 200px;
        }
        .ag-cell-qty {
          width: 100px;
          justify-content: center;
        }
        .ag-cell-unit {
          width: 80px;
          justify-content: center;
        }
        .ag-cell-cost {
          width: 100px;
          justify-content: flex-end;
        }
        .ag-cell-total {
          width: 100px;
          justify-content: flex-end;
        }
        .ag-cell-actions {
          width: 80px;
          justify-content: center;
        }
        .ag-cell-active {
          box-shadow: inset 0 0 0 2px hsl(var(--primary));
        }
        .ag-cell-input {
          height: 32px;
          width: 80px;
          text-align: center;
          font-family: monospace;
          border: 1px solid transparent;
          background: transparent;
        }
        .ag-cell-input:focus {
          outline: none;
          background: hsl(var(--background));
          border-color: hsl(var(--border));
        }
      `}</style>
    </Card>
  );
};

export default BOMPanel;
