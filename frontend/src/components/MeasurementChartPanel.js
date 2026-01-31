import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Trash2, Ruler, Settings2, X } from 'lucide-react';

// Common measurement points for different product types
const commonMeasurementPoints = [
  'Chest', 'Waist', 'Hip', 'Length', 'Shoulder', 'Sleeve', 
  'Inseam', 'Outseam', 'Rise', 'Thigh', 'Knee', 'Leg Opening',
  'Neck', 'Back Length', 'Front Length', 'Armhole', 'Cuff'
];

const MeasurementChartPanel = ({ 
  measurements = [], 
  onChange, 
  sizes = [], 
  readOnly = false 
}) => {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState(() => {
    // Extract existing measurement points from data
    const existingPoints = new Set();
    measurements.forEach(m => {
      Object.keys(m.measurements || {}).forEach(key => existingPoints.add(key));
    });
    return existingPoints.size > 0 ? Array.from(existingPoints) : ['Chest', 'Waist', 'Length'];
  });
  const [newPoint, setNewPoint] = useState('');

  // Get sizes that are already in measurements
  const usedSizeIds = useMemo(() => 
    new Set(measurements.map(m => m.size_id)), 
    [measurements]
  );

  // Get available sizes (not yet added)
  const availableSizes = useMemo(() => 
    sizes.filter(s => !usedSizeIds.has(s.id)),
    [sizes, usedSizeIds]
  );

  const addMeasurementPoint = () => {
    if (newPoint.trim() && !measurementPoints.includes(newPoint.trim())) {
      const point = newPoint.trim();
      setMeasurementPoints([...measurementPoints, point]);
      // Add the new point to all existing measurements with value 0
      const updatedMeasurements = measurements.map(m => ({
        ...m,
        measurements: { ...m.measurements, [point]: 0 }
      }));
      onChange(updatedMeasurements);
      setNewPoint('');
    }
  };

  const removeMeasurementPoint = (point) => {
    setMeasurementPoints(measurementPoints.filter(p => p !== point));
    // Remove the point from all measurements
    const updatedMeasurements = measurements.map(m => {
      const { [point]: removed, ...rest } = m.measurements || {};
      return { ...m, measurements: rest };
    });
    onChange(updatedMeasurements);
  };

  const addSizeRow = (sizeId) => {
    const size = sizes.find(s => s.id === sizeId);
    if (!size) return;

    const newMeasurement = {
      id: `meas-${Date.now()}`,
      size_id: size.id,
      size_name: size.name,
      size_code: size.code,
      measurements: measurementPoints.reduce((acc, point) => {
        acc[point] = 0;
        return acc;
      }, {})
    };

    onChange([...measurements, newMeasurement]);
  };

  const removeSizeRow = (measurementId) => {
    onChange(measurements.filter(m => m.id !== measurementId));
  };

  const updateMeasurement = (measurementId, point, value) => {
    const updatedMeasurements = measurements.map(m => {
      if (m.id === measurementId) {
        return {
          ...m,
          measurements: {
            ...m.measurements,
            [point]: parseFloat(value) || 0
          }
        };
      }
      return m;
    });
    onChange(updatedMeasurements);
  };

  const addFromPreset = (point) => {
    if (!measurementPoints.includes(point)) {
      setMeasurementPoints([...measurementPoints, point]);
      // Add to existing measurements
      const updatedMeasurements = measurements.map(m => ({
        ...m,
        measurements: { ...m.measurements, [point]: 0 }
      }));
      onChange(updatedMeasurements);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Measurement Chart
          </CardTitle>
          <div className="flex gap-2">
            {!readOnly && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsConfigDialogOpen(true)}
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Configure
                </Button>
                {availableSizes.length > 0 && (
                  <Select onValueChange={addSizeRow}>
                    <SelectTrigger className="w-[140px] h-9">
                      <Plus className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Add Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name} ({size.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {measurementPoints.length === 0 ? (
          <div className="p-8 text-center">
            <Ruler className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No measurement points configured</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsConfigDialogOpen(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Configure Measurements
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background min-w-[100px]">Size</TableHead>
                  {measurementPoints.map((point) => (
                    <TableHead key={point} className="text-center min-w-[80px]">
                      {point}
                    </TableHead>
                  ))}
                  {!readOnly && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={measurementPoints.length + (readOnly ? 1 : 2)} 
                      className="h-24 text-center"
                    >
                      <p className="text-muted-foreground">No sizes added</p>
                      {sizes.length === 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Add sizes to your library first
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Select a size from the dropdown above
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  measurements.map((measurement) => (
                    <TableRow key={measurement.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{measurement.size_code || measurement.size_name}</Badge>
                          <span className="text-sm text-muted-foreground">{measurement.size_name}</span>
                        </div>
                      </TableCell>
                      {measurementPoints.map((point) => (
                        <TableCell key={point} className="text-center p-1">
                          {readOnly ? (
                            <span className="font-mono">
                              {measurement.measurements?.[point] || '-'}
                            </span>
                          ) : (
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              className="h-8 w-20 text-center font-mono mx-auto"
                              value={measurement.measurements?.[point] || ''}
                              onChange={(e) => updateMeasurement(measurement.id, point, e.target.value)}
                              placeholder="0"
                            />
                          )}
                        </TableCell>
                      ))}
                      {!readOnly && (
                        <TableCell className="p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeSizeRow(measurement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Unit hint */}
        {measurements.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            All measurements in centimeters (cm)
          </div>
        )}
      </CardContent>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Measurement Points</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Current Points */}
            <div className="space-y-2">
              <Label>Active Measurement Points</Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/30">
                {measurementPoints.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No points configured</span>
                ) : (
                  measurementPoints.map((point) => (
                    <Badge key={point} variant="secondary" className="gap-1 pr-1">
                      {point}
                      <button
                        className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                        onClick={() => removeMeasurementPoint(point)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Add Custom Point */}
            <div className="space-y-2">
              <Label>Add Custom Point</Label>
              <div className="flex gap-2">
                <Input
                  value={newPoint}
                  onChange={(e) => setNewPoint(e.target.value)}
                  placeholder="e.g., Collar Width"
                  onKeyPress={(e) => e.key === 'Enter' && addMeasurementPoint()}
                />
                <Button onClick={addMeasurementPoint} disabled={!newPoint.trim()}>
                  Add
                </Button>
              </div>
            </div>

            {/* Common Presets */}
            <div className="space-y-2">
              <Label>Common Measurements</Label>
              <div className="flex flex-wrap gap-2">
                {commonMeasurementPoints
                  .filter(p => !measurementPoints.includes(p))
                  .map((point) => (
                    <Button
                      key={point}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => addFromPreset(point)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {point}
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsConfigDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MeasurementChartPanel;
