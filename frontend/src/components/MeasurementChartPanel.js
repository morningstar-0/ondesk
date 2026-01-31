import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Plus, Trash2, Ruler, Check, X } from 'lucide-react';

const MeasurementChartPanel = ({ 
  measurements = [], 
  onChange, 
  sizes = [],
  pomList = [],
  readOnly = false 
}) => {
  const [selectedPoms, setSelectedPoms] = useState(() => {
    // Initialize from existing measurements
    const existingPoms = new Set();
    measurements.forEach(m => {
      Object.keys(m.measurements || {}).forEach(key => existingPoms.add(key));
    });
    return Array.from(existingPoms);
  });
  const [activeCell, setActiveCell] = useState(null);
  const [showInches, setShowInches] = useState(false);
  const [baseSize, setBaseSize] = useState('M');
  const [addingPom, setAddingPom] = useState(false);
  const [newPomId, setNewPomId] = useState('');
  const inputRefs = useRef({});

  // Get size objects sorted by sort_order
  const sortedSizes = [...sizes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Ensure measurements exist for all sizes
  const ensureMeasurementsForSizes = () => {
    const existingMeasurements = [...measurements];
    sortedSizes.forEach(size => {
      const exists = existingMeasurements.some(m => m.size_id === size.id || m.size_code === size.code);
      if (!exists) {
        existingMeasurements.push({
          id: `meas-${size.id}-${Date.now()}`,
          size_id: size.id,
          size_name: size.name,
          size_code: size.code,
          measurements: {}
        });
      }
    });
    return existingMeasurements;
  };

  // Get POM data
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

  const addPom = () => {
    if (newPomId && !selectedPoms.includes(newPomId)) {
      const pom = pomList.find(p => p.id === newPomId);
      if (pom) {
        setSelectedPoms([...selectedPoms, pom.code]);
        
        // Initialize measurements for new POM across all sizes
        let updatedMeasurements = ensureMeasurementsForSizes();
        updatedMeasurements = updatedMeasurements.map(m => ({
          ...m,
          measurements: { ...m.measurements, [pom.code]: 0 }
        }));
        onChange(updatedMeasurements);
      }
    }
    setAddingPom(false);
    setNewPomId('');
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

    let updatedMeasurements = ensureMeasurementsForSizes();
    updatedMeasurements = updatedMeasurements.map(m => {
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {selectedPoms.length === 0 && !addingPom ? (
          <div className="p-12 text-center bg-slate-50/50">
            <Ruler className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No measurement points added</p>
            <p className="text-sm text-slate-400 mt-1">
              {pomList.length === 0 
                ? 'Add points to your POM library first'
                : 'Click "Add POM" to add measurement points'}
            </p>
            {pomList.length > 0 && !readOnly && (
              <Button 
                size="sm" 
                className="mt-4"
                onClick={() => setAddingPom(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add POM
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-100 w-24 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
                    POM Code
                  </th>
                  <th className="sticky left-24 z-10 bg-slate-100 min-w-[160px] px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-r">
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
                    <td className="sticky left-0 z-10 bg-inherit w-24 px-3 py-2 border-r">
                      <span className="font-mono text-sm text-slate-700">{pom.code}</span>
                    </td>
                    <td className="sticky left-24 z-10 bg-inherit min-w-[160px] px-3 py-2 border-r">
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
                
                {/* Add POM Row */}
                {addingPom && (
                  <tr className="bg-yellow-50 border-b">
                    <td colSpan={5 + sortedSizes.length + 1} className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Select value={newPomId} onValueChange={setNewPomId}>
                          <SelectTrigger className="w-[300px] h-9">
                            <SelectValue placeholder="Select a POM to add..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePoms.map(pom => (
                              <SelectItem key={pom.id} value={pom.id}>
                                <span className="font-mono text-xs mr-2">{pom.code}</span>
                                {pom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={addPom} disabled={!newPomId}>
                          <Check className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAddingPom(false); setNewPomId(''); }}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Add POM Button */}
            {!addingPom && !readOnly && availablePoms.length > 0 && (
              <div className="px-4 py-3 border-t bg-white">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setAddingPom(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add POM
                </Button>
              </div>
            )}
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
    </Card>
  );
};

export default MeasurementChartPanel;
