import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Plus, Trash2, Ruler, Settings2, ChevronDown, ChevronRight, AlertCircle, Search } from 'lucide-react';

const MeasurementChartPanel = ({ 
  measurements = [], 
  onChange, 
  sizes = [],
  pomList = [],
  readOnly = false 
}) => {
  const [selectedPoms, setSelectedPoms] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [showInches, setShowInches] = useState(false);
  const [isAddPomDialogOpen, setIsAddPomDialogOpen] = useState(false);
  const [baseSize, setBaseSize] = useState('M');
  const inputRefs = useRef({});

  // Initialize selected POMs from existing measurements or pomList
  useEffect(() => {
    if (measurements.length > 0 && selectedPoms.length === 0) {
      const existingPoms = new Set();
      measurements.forEach(m => {
        Object.keys(m.measurements || {}).forEach(key => existingPoms.add(key));
      });
      if (existingPoms.size > 0) {
        setSelectedPoms(Array.from(existingPoms));
      }
    }
  }, [measurements, selectedPoms.length]);

  // Get size objects sorted by sort_order
  const sortedSizes = [...sizes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Get POM data including tolerances and grades
  const getPomData = () => {
    return selectedPoms.map(pomCode => {
      const pom = pomList.find(p => p.code === pomCode);
      const measurementData = {};
      sortedSizes.forEach(size => {
        const sizeData = measurements.find(m => m.size_id === size.id || m.size_code === size.code);
        measurementData[size.code] = sizeData?.measurements?.[pomCode] || 0;
      });
      return {
        code: pomCode,
        name: pom?.name || pomCode,
        description: pom?.description || '',
        unit: pom?.unit || 'cm',
        negativeTolerance: 0.25,
        positiveTolerance: 0.25,
        grade: 0.5,
        measurements: measurementData
      };
    });
  };

  const pomData = getPomData();

  const addPom = (pomCode) => {
    if (!selectedPoms.includes(pomCode)) {
      setSelectedPoms([...selectedPoms, pomCode]);
      // Initialize measurements for new POM
      const updatedMeasurements = measurements.map(m => ({
        ...m,
        measurements: { ...m.measurements, [pomCode]: 0 }
      }));
      // If no measurements exist, create one for each size
      if (measurements.length === 0 && sortedSizes.length > 0) {
        const newMeasurements = sortedSizes.map(size => ({
          id: `meas-${size.id}-${Date.now()}`,
          size_id: size.id,
          size_name: size.name,
          size_code: size.code,
          measurements: { [pomCode]: 0 }
        }));
        onChange(newMeasurements);
      } else {
        onChange(updatedMeasurements);
      }
    }
    setIsAddPomDialogOpen(false);
  };

  const removePom = (pomCode) => {
    setSelectedPoms(selectedPoms.filter(c => c !== pomCode));
    const updatedMeasurements = measurements.map(m => {
      const { [pomCode]: removed, ...rest } = m.measurements || {};
      return { ...m, measurements: rest };
    });
    onChange(updatedMeasurements);
  };

  const updateMeasurement = (pomCode, sizeCode, value) => {
    const size = sortedSizes.find(s => s.code === sizeCode);
    if (!size) return;

    let sizeExists = measurements.some(m => m.size_id === size.id || m.size_code === sizeCode);
    
    let updatedMeasurements;
    if (sizeExists) {
      updatedMeasurements = measurements.map(m => {
        if (m.size_id === size.id || m.size_code === sizeCode) {
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
    } else {
      // Create new measurement for this size
      const newMeasurement = {
        id: `meas-${size.id}-${Date.now()}`,
        size_id: size.id,
        size_name: size.name,
        size_code: size.code,
        measurements: { [pomCode]: parseFloat(value) || 0 }
      };
      updatedMeasurements = [...measurements, newMeasurement];
    }
    onChange(updatedMeasurements);
  };

  const convertToInches = (cm) => {
    return (cm / 2.54).toFixed(2);
  };

  const handleKeyDown = (e, pomIndex, sizeIndex) => {
    const totalPoms = pomData.length;
    const totalSizes = sortedSizes.length;
    let newPomIndex = pomIndex;
    let newSizeIndex = sizeIndex;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newPomIndex = Math.max(0, pomIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newPomIndex = Math.min(totalPoms - 1, pomIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newSizeIndex = Math.max(0, sizeIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newSizeIndex = Math.min(totalSizes - 1, sizeIndex + 1);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (sizeIndex > 0) newSizeIndex = sizeIndex - 1;
          else if (pomIndex > 0) {
            newPomIndex = pomIndex - 1;
            newSizeIndex = totalSizes - 1;
          }
        } else {
          if (sizeIndex < totalSizes - 1) newSizeIndex = sizeIndex + 1;
          else if (pomIndex < totalPoms - 1) {
            newPomIndex = pomIndex + 1;
            newSizeIndex = 0;
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (pomIndex < totalPoms - 1) newPomIndex = pomIndex + 1;
        break;
      default:
        return;
    }

    const key = `${pomData[newPomIndex]?.code}-${sortedSizes[newSizeIndex]?.code}`;
    if (inputRefs.current[key]) {
      inputRefs.current[key].focus();
      inputRefs.current[key].select();
    }
  };

  const availablePoms = pomList.filter(p => !selectedPoms.includes(p.code));

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      {/* Header */}
      <CardHeader className="pb-3 bg-slate-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ruler className="h-5 w-5 text-slate-600" />
              Measurement Chart
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {showInches ? 'Inches' : 'CM'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {/* Unit Toggle */}
            <div className="flex items-center gap-2 text-sm">
              <span className={!showInches ? 'font-medium' : 'text-muted-foreground'}>CM</span>
              <Switch
                checked={showInches}
                onCheckedChange={setShowInches}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className={showInches ? 'font-medium' : 'text-muted-foreground'}>Inches</span>
            </div>
            
            {!readOnly && (
              <Button size="sm" onClick={() => setIsAddPomDialogOpen(true)} disabled={availablePoms.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Add POM
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {selectedPoms.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50">
            <Ruler className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No measurement points added</p>
            <p className="text-sm text-slate-400 mt-1">
              {pomList.length === 0 
                ? 'Add points to your POM library first'
                : 'Click "Add POM" to add measurement points'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-100 w-10 px-2 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    !
                  </th>
                  <th className="sticky left-10 z-10 bg-slate-100 w-24 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    POM Code
                  </th>
                  <th className="sticky left-[136px] z-10 bg-slate-100 min-w-[180px] px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    POM Name
                  </th>
                  <th className="w-16 px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    -Tol.
                  </th>
                  <th className="w-16 px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    +Tol.
                  </th>
                  <th className="w-16 px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    Grade
                  </th>
                  {sortedSizes.map(size => (
                    <th 
                      key={size.id}
                      className={`w-20 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider border-r ${
                        size.code === baseSize 
                          ? 'bg-teal-500 text-white' 
                          : 'text-slate-500'
                      }`}
                    >
                      {size.code}
                    </th>
                  ))}
                  {!readOnly && <th className="w-10 px-2 py-3" />}
                </tr>
              </thead>
              <tbody>
                {pomData.map((pom, pomIndex) => (
                  <tr 
                    key={pom.code} 
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      pomIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit w-10 px-2 py-2 text-center border-r">
                      <AlertCircle className="h-4 w-4 text-amber-500 mx-auto" />
                    </td>
                    <td className="sticky left-10 z-10 bg-inherit w-24 px-3 py-2 border-r">
                      <span className="font-mono text-sm text-slate-700">{pom.code}</span>
                    </td>
                    <td className="sticky left-[136px] z-10 bg-inherit min-w-[180px] px-3 py-2 border-r">
                      <span className="font-medium text-sm text-slate-800">{pom.name}</span>
                    </td>
                    <td className="w-16 px-2 py-2 text-center border-r">
                      <span className="text-sm text-slate-600">{pom.negativeTolerance}</span>
                    </td>
                    <td className="w-16 px-2 py-2 text-center border-r">
                      <span className="text-sm text-slate-600">{pom.positiveTolerance}</span>
                    </td>
                    <td className="w-16 px-2 py-2 text-center border-r">
                      <span className="text-sm text-slate-600">{pom.grade}</span>
                    </td>
                    {sortedSizes.map((size, sizeIndex) => {
                      const value = pom.measurements[size.code] || 0;
                      const displayValue = showInches ? convertToInches(value) : value;
                      const isBaseSize = size.code === baseSize;
                      
                      return (
                        <td 
                          key={size.id}
                          className={`w-20 px-1 py-1 text-center border-r ${
                            isBaseSize ? 'bg-teal-50' : ''
                          } ${activeCell === `${pom.code}-${size.code}` ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                        >
                          {readOnly ? (
                            <span className="font-mono text-sm">{displayValue || '-'}</span>
                          ) : (
                            <Input
                              ref={(el) => { inputRefs.current[`${pom.code}-${size.code}`] = el; }}
                              type="number"
                              step="0.1"
                              min="0"
                              className={`h-8 w-full text-center font-mono text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-400 ${
                                isBaseSize ? 'font-semibold' : ''
                              }`}
                              value={value || ''}
                              onChange={(e) => updateMeasurement(pom.code, size.code, e.target.value)}
                              onFocus={() => setActiveCell(`${pom.code}-${size.code}`)}
                              onBlur={() => setActiveCell(null)}
                              onKeyDown={(e) => handleKeyDown(e, pomIndex, sizeIndex)}
                              placeholder="0"
                            />
                          )}
                        </td>
                      );
                    })}
                    {!readOnly && (
                      <td className="w-10 px-1 py-1 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-500"
                          onClick={() => removePom(pom.code)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer */}
        {pomData.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500 flex items-center justify-between">
            <span>Use arrow keys or Tab to navigate • Base size: <strong>{baseSize}</strong></span>
            <span>{pomData.length} measurement point{pomData.length !== 1 ? 's' : ''} × {sortedSizes.length} size{sortedSizes.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>

      {/* Add POM Dialog */}
      <Dialog open={isAddPomDialogOpen} onOpenChange={setIsAddPomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Measurement Point</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search POMs..." className="pl-9" />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {availablePoms.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No more POMs available</p>
              ) : (
                availablePoms.map(pom => (
                  <button
                    key={pom.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 transition-colors text-left"
                    onClick={() => addPom(pom.code)}
                  >
                    <div>
                      <span className="font-mono text-sm text-slate-600 mr-2">{pom.code}</span>
                      <span className="font-medium">{pom.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{pom.category}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPomDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MeasurementChartPanel;
