import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Trash2, Ruler, Settings2 } from 'lucide-react';

const MeasurementChartPanel = ({ 
  measurements = [], 
  onChange, 
  sizes = [],
  pomList = [],
  readOnly = false 
}) => {
  const [selectedPoms, setSelectedPoms] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const inputRefs = useRef({});

  // Initialize selected POMs from existing measurements
  useEffect(() => {
    if (measurements.length > 0 && selectedPoms.length === 0) {
      const existingPoms = new Set();
      measurements.forEach(m => {
        Object.keys(m.measurements || {}).forEach(key => existingPoms.add(key));
      });
      if (existingPoms.size > 0) {
        const matchingPoms = pomList.filter(p => existingPoms.has(p.code) || existingPoms.has(p.name));
        if (matchingPoms.length > 0) {
          setSelectedPoms(matchingPoms.map(p => p.id));
        }
      }
    }
  }, [measurements, pomList, selectedPoms.length]);

  // Get used size IDs
  const usedSizeIds = new Set(measurements.map(m => m.size_id));
  const availableSizes = sizes.filter(s => !usedSizeIds.has(s.id));

  // Get selected POM objects
  const selectedPomObjects = pomList.filter(p => selectedPoms.includes(p.id));

  const addPom = (pomId) => {
    if (!selectedPoms.includes(pomId)) {
      const pom = pomList.find(p => p.id === pomId);
      if (pom) {
        setSelectedPoms([...selectedPoms, pomId]);
        // Add this POM to all existing measurements
        const updatedMeasurements = measurements.map(m => ({
          ...m,
          measurements: { ...m.measurements, [pom.code]: 0 }
        }));
        onChange(updatedMeasurements);
      }
    }
  };

  const removePom = (pomId) => {
    const pom = pomList.find(p => p.id === pomId);
    if (pom) {
      setSelectedPoms(selectedPoms.filter(id => id !== pomId));
      // Remove this POM from all measurements
      const updatedMeasurements = measurements.map(m => {
        const { [pom.code]: removed, ...rest } = m.measurements || {};
        return { ...m, measurements: rest };
      });
      onChange(updatedMeasurements);
    }
  };

  const addSizeRow = (sizeId) => {
    const size = sizes.find(s => s.id === sizeId);
    if (!size) return;

    const initialMeasurements = {};
    selectedPomObjects.forEach(pom => {
      initialMeasurements[pom.code] = 0;
    });

    const newMeasurement = {
      id: `meas-${Date.now()}`,
      size_id: size.id,
      size_name: size.name,
      size_code: size.code,
      measurements: initialMeasurements
    };

    onChange([...measurements, newMeasurement]);
  };

  const removeSizeRow = (measurementId) => {
    onChange(measurements.filter(m => m.id !== measurementId));
  };

  const updateMeasurement = (measurementId, pomCode, value) => {
    const updatedMeasurements = measurements.map(m => {
      if (m.id === measurementId) {
        return {
          ...m,
          measurements: {
            ...m.measurements,
            [pomCode]: parseFloat(value) || 0
          }
        };
      }
      return m;
    });
    onChange(updatedMeasurements);
  };

  // Keyboard navigation for AG Grid-like experience
  const handleKeyDown = (e, rowIndex, colIndex, measurementId, pomCode) => {
    const totalRows = measurements.length;
    const totalCols = selectedPomObjects.length;

    let newRow = rowIndex;
    let newCol = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(totalRows - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        if (e.target.selectionStart === 0) {
          e.preventDefault();
          newCol = Math.max(0, colIndex - 1);
        }
        return;
      case 'ArrowRight':
        if (e.target.selectionStart === e.target.value.length) {
          e.preventDefault();
          newCol = Math.min(totalCols - 1, colIndex + 1);
        }
        return;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) {
            newCol = colIndex - 1;
          } else if (rowIndex > 0) {
            newRow = rowIndex - 1;
            newCol = totalCols - 1;
          }
        } else {
          if (colIndex < totalCols - 1) {
            newCol = colIndex + 1;
          } else if (rowIndex < totalRows - 1) {
            newRow = rowIndex + 1;
            newCol = 0;
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        newRow = Math.min(totalRows - 1, rowIndex + 1);
        break;
      default:
        return;
    }

    const newMeasurement = measurements[newRow];
    const newPom = selectedPomObjects[newCol];
    if (newMeasurement && newPom) {
      const key = `${newMeasurement.id}-${newPom.code}`;
      if (inputRefs.current[key]) {
        inputRefs.current[key].focus();
        inputRefs.current[key].select();
      }
    }
  };

  const availablePoms = pomList.filter(p => !selectedPoms.includes(p.id));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Measurement Chart
          </CardTitle>
          <div className="flex gap-2">
            {!readOnly && availablePoms.length > 0 && (
              <Select onValueChange={addPom}>
                <SelectTrigger className="w-[160px] h-9">
                  <Settings2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Add POM" />
                </SelectTrigger>
                <SelectContent>
                  {availablePoms.map((pom) => (
                    <SelectItem key={pom.id} value={pom.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{pom.code}</span>
                        <span>{pom.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!readOnly && availableSizes.length > 0 && (
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
          </div>
        </div>
        {/* Selected POMs */}
        {selectedPomObjects.length > 0 && !readOnly && (
          <div className="flex flex-wrap gap-1 mt-3">
            {selectedPomObjects.map(pom => (
              <Badge 
                key={pom.id} 
                variant="secondary" 
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => removePom(pom.id)}
              >
                {pom.code}
                <span className="text-destructive ml-1">×</span>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {selectedPomObjects.length === 0 ? (
          <div className="p-8 text-center">
            <Ruler className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No measurement points selected</p>
            {pomList.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                Add points to your POM library first
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Select measurement points from the dropdown above
              </p>
            )}
          </div>
        ) : (
          <div className="ag-grid-wrapper">
            {/* AG Grid-like header */}
            <div className="ag-header">
              <div className="ag-header-row">
                <div className="ag-header-cell ag-header-cell-size">Size</div>
                {selectedPomObjects.map((pom) => (
                  <div key={pom.id} className="ag-header-cell" title={pom.name}>
                    <span className="font-mono">{pom.code}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({pom.unit})</span>
                  </div>
                ))}
                {!readOnly && <div className="ag-header-cell ag-header-cell-actions" />}
              </div>
            </div>
            
            {/* AG Grid-like body */}
            <div className="ag-body">
              {measurements.length === 0 ? (
                <div className="ag-row ag-row-empty">
                  <div className="p-8 text-center w-full">
                    <p className="text-muted-foreground">No sizes added</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a size from the dropdown above
                    </p>
                  </div>
                </div>
              ) : (
                measurements.map((measurement, rowIndex) => (
                  <div 
                    key={measurement.id} 
                    className={`ag-row ${rowIndex % 2 === 0 ? 'ag-row-even' : 'ag-row-odd'}`}
                  >
                    <div className="ag-cell ag-cell-size">
                      <Badge variant="outline" className="font-mono">
                        {measurement.size_code || measurement.size_name}
                      </Badge>
                    </div>
                    {selectedPomObjects.map((pom, colIndex) => (
                      <div 
                        key={pom.id} 
                        className={`ag-cell ${activeCell === `${measurement.id}-${pom.code}` ? 'ag-cell-active' : ''}`}
                      >
                        {readOnly ? (
                          <span className="font-mono text-sm">
                            {measurement.measurements?.[pom.code] || '-'}
                          </span>
                        ) : (
                          <Input
                            ref={(el) => { inputRefs.current[`${measurement.id}-${pom.code}`] = el; }}
                            type="number"
                            step="0.1"
                            min="0"
                            className="ag-cell-input"
                            value={measurement.measurements?.[pom.code] || ''}
                            onChange={(e) => updateMeasurement(measurement.id, pom.code, e.target.value)}
                            onFocus={() => setActiveCell(`${measurement.id}-${pom.code}`)}
                            onBlur={() => setActiveCell(null)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex, measurement.id, pom.code)}
                            placeholder="0"
                          />
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <div className="ag-cell ag-cell-actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeSizeRow(measurement.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Unit hint */}
        {measurements.length > 0 && selectedPomObjects.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
            <span>Use arrow keys or Tab to navigate between cells</span>
            <span>All values in measurement unit specified per POM</span>
          </div>
        )}
      </CardContent>

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
          min-width: 80px;
          flex: 1;
          border-right: 1px solid hsl(var(--border));
        }
        .ag-header-cell-size {
          min-width: 100px;
          max-width: 100px;
          flex: none;
          background: hsl(var(--muted));
          position: sticky;
          left: 0;
          z-index: 1;
        }
        .ag-header-cell-actions {
          min-width: 50px;
          max-width: 50px;
          flex: none;
        }
        .ag-body {
          overflow-x: auto;
        }
        .ag-row {
          display: flex;
          min-height: 40px;
          border-bottom: 1px solid hsl(var(--border));
        }
        .ag-row-even {
          background: hsl(var(--background));
        }
        .ag-row-odd {
          background: hsl(var(--muted) / 0.3);
        }
        .ag-row:hover {
          background: hsl(var(--accent));
        }
        .ag-row-empty {
          justify-content: center;
        }
        .ag-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          min-width: 80px;
          flex: 1;
          border-right: 1px solid hsl(var(--border) / 0.5);
        }
        .ag-cell-size {
          min-width: 100px;
          max-width: 100px;
          flex: none;
          justify-content: flex-start;
          padding-left: 12px;
          background: inherit;
          position: sticky;
          left: 0;
          z-index: 1;
        }
        .ag-cell-actions {
          min-width: 50px;
          max-width: 50px;
          flex: none;
        }
        .ag-cell-active {
          box-shadow: inset 0 0 0 2px hsl(var(--primary));
        }
        .ag-cell-input {
          height: 32px;
          width: 100%;
          text-align: center;
          font-family: monospace;
          border: none;
          background: transparent;
          padding: 0 4px;
        }
        .ag-cell-input:focus {
          outline: none;
          background: hsl(var(--background));
        }
      `}</style>
    </Card>
  );
};

export default MeasurementChartPanel;
