import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Plus, Trash2, Package, DollarSign, Calculator } from 'lucide-react';

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

  const handleDelete = (itemId) => {
    onChange(bom.filter(item => item.id !== itemId));
  };

  const totalBomCost = bom.reduce((sum, item) => sum + (item.total_cost || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="w-[100px]">Qty</TableHead>
              <TableHead className="w-[80px]">Unit</TableHead>
              <TableHead className="w-[100px] text-right">Unit Cost</TableHead>
              <TableHead className="w-[100px] text-right">Total</TableHead>
              {!readOnly && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bom.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 5 : 6} className="h-24 text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No materials added</p>
                  {materials.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add materials to your library first
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {bom.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={!readOnly ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => !readOnly && openEditDialog(item)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.material_name}</span>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">
                          {item.material_code}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.unit_cost?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ${item.total_cost?.toFixed(2) || '0.00'}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={4} className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Calculator className="h-4 w-4" />
                      Total BOM Cost
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    ${totalBomCost.toFixed(2)}
                  </TableCell>
                  {!readOnly && <TableCell />}
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
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
    </Card>
  );
};

export default BOMPanel;
