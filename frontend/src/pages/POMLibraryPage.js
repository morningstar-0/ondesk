import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Ruler, Search, Check, X } from 'lucide-react';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'accessories', label: 'Accessories' }
];

const units = [
  { value: 'cm', label: 'cm' },
  { value: 'in', label: 'in' },
  { value: 'mm', label: 'mm' }
];

const POMLibraryPage = () => {
  const { api } = useAuth();
  const [pomList, setPomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const inputRefs = useRef({});

  const fetchPomList = useCallback(async () => {
    try {
      const response = await api.get('/pom');
      setPomList(response.data);
    } catch (error) {
      toast.error('Failed to load POM library');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPomList();
  }, [fetchPomList]);

  const addNewRow = () => {
    const newPom = {
      id: `new-${Date.now()}`,
      code: '',
      name: '',
      description: '',
      category: 'general',
      unit: 'cm',
      sort_order: pomList.length,
      isNew: true
    };
    setPomList([...pomList, newPom]);
    setEditingId(newPom.id);
    
    setTimeout(() => {
      if (inputRefs.current[`${newPom.id}-code`]) {
        inputRefs.current[`${newPom.id}-code`].focus();
      }
    }, 100);
  };

  const updateLocalPom = (pomId, field, value) => {
    setPomList(pomList.map(p => 
      p.id === pomId ? { ...p, [field]: value } : p
    ));
  };

  const confirmRow = async (pomId) => {
    const pom = pomList.find(p => p.id === pomId);
    if (!pom) return;
    
    if (!pom.code.trim() || !pom.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      if (pom.isNew) {
        const response = await api.post('/pom', {
          code: pom.code,
          name: pom.name,
          description: pom.description,
          category: pom.category,
          unit: pom.unit,
          sort_order: pom.sort_order
        });
        // Replace temp ID with real ID
        setPomList(pomList.map(p => 
          p.id === pomId ? { ...response.data, isNew: false } : p
        ));
        toast.success('POM created');
      } else {
        await api.put(`/pom/${pomId}`, {
          code: pom.code,
          name: pom.name,
          description: pom.description,
          category: pom.category,
          unit: pom.unit,
          sort_order: pom.sort_order
        });
        setPomList(pomList.map(p => 
          p.id === pomId ? { ...p, isNew: false } : p
        ));
        toast.success('POM updated');
      }
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to save POM');
    }
  };

  const cancelRow = (pomId) => {
    const pom = pomList.find(p => p.id === pomId);
    if (pom?.isNew) {
      setPomList(pomList.filter(p => p.id !== pomId));
    } else {
      // Reload to discard changes
      fetchPomList();
    }
    setEditingId(null);
  };

  const handleDelete = async (pomId) => {
    const pom = pomList.find(p => p.id === pomId);
    if (pom?.isNew) {
      setPomList(pomList.filter(p => p.id !== pomId));
      return;
    }
    
    if (!window.confirm('Delete this measurement point?')) return;
    try {
      await api.delete(`/pom/${pomId}`);
      setPomList(pomList.filter(p => p.id !== pomId));
      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleKeyDown = (e, pomId) => {
    if (e.key === 'Enter') {
      confirmRow(pomId);
    } else if (e.key === 'Escape') {
      cancelRow(pomId);
    }
  };

  const filteredList = pomList.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      tops: 'bg-blue-100 text-blue-800',
      bottoms: 'bg-green-100 text-green-800',
      dresses: 'bg-pink-100 text-pink-800',
      outerwear: 'bg-orange-100 text-orange-800',
      footwear: 'bg-purple-100 text-purple-800',
      accessories: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="p-6 space-y-6" data-testid="pom-library-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Public_Sans']">Points of Measurement</h1>
          <p className="text-muted-foreground">Define measurement points for your products</p>
        </div>
        <Button onClick={addNewRow} data-testid="create-pom-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Measurement Point
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredList.filter(p => !p.isNew).length} measurement point{filteredList.filter(p => !p.isNew).length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wider">
                  <th className="w-12 px-3 py-3 text-left">#</th>
                  <th className="w-28 px-3 py-3 text-left">Code</th>
                  <th className="min-w-[180px] px-3 py-3 text-left">Name</th>
                  <th className="w-32 px-3 py-3 text-left">Category</th>
                  <th className="w-20 px-3 py-3 text-left">Unit</th>
                  <th className="min-w-[200px] px-3 py-3 text-left">Description</th>
                  <th className="w-24 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="h-24 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-24 text-center">
                      <Ruler className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No measurement points found</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={addNewRow}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first point
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((pom, index) => {
                    const isEditing = editingId === pom.id || pom.isNew;
                    
                    return (
                      <tr 
                        key={pom.id} 
                        className={`border-b border-slate-100 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        } ${isEditing ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}
                        onDoubleClick={() => setEditingId(pom.id)}
                      >
                        <td className="w-12 px-3 py-2 text-muted-foreground text-sm">
                          {index + 1}
                        </td>
                        <td className="w-28 px-3 py-2">
                          {isEditing ? (
                            <Input
                              ref={el => inputRefs.current[`${pom.id}-code`] = el}
                              value={pom.code || ''}
                              onChange={(e) => updateLocalPom(pom.id, 'code', e.target.value.toUpperCase())}
                              onKeyDown={(e) => handleKeyDown(e, pom.id)}
                              className="h-8 font-mono text-sm"
                              placeholder="CODE"
                            />
                          ) : (
                            <span className="font-mono text-sm">{pom.code}</span>
                          )}
                        </td>
                        <td className="min-w-[180px] px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={pom.name || ''}
                              onChange={(e) => updateLocalPom(pom.id, 'name', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, pom.id)}
                              className="h-8 text-sm"
                              placeholder="Measurement name"
                            />
                          ) : (
                            <span className="font-medium">{pom.name}</span>
                          )}
                        </td>
                        <td className="w-32 px-3 py-2">
                          {isEditing ? (
                            <Select
                              value={pom.category || 'general'}
                              onValueChange={(v) => updateLocalPom(pom.id, 'category', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(c => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className={getCategoryColor(pom.category)}>
                              {pom.category}
                            </Badge>
                          )}
                        </td>
                        <td className="w-20 px-3 py-2">
                          {isEditing ? (
                            <Select
                              value={pom.unit || 'cm'}
                              onValueChange={(v) => updateLocalPom(pom.id, 'unit', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map(u => (
                                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{pom.unit}</span>
                          )}
                        </td>
                        <td className="min-w-[200px] px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={pom.description || ''}
                              onChange={(e) => updateLocalPom(pom.id, 'description', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, pom.id)}
                              className="h-8 text-sm"
                              placeholder="Description"
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm truncate block max-w-[200px]">
                              {pom.description || '-'}
                            </span>
                          )}
                        </td>
                        <td className="w-24 px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => confirmRow(pom.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                                  onClick={() => cancelRow(pom.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-slate-400 hover:text-red-500"
                                onClick={() => handleDelete(pom.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t text-xs text-slate-500">
            Double-click row to edit • Enter to confirm • Esc to cancel
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default POMLibraryPage;
