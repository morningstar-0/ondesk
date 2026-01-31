import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Save, RefreshCw, Box, Package, Layers, Palette, Eye } from 'lucide-react';

const entityTypes = [
  { value: 'asset', label: 'Asset', icon: Box, color: 'bg-blue-500' },
  { value: 'product', label: 'Product', icon: Package, color: 'bg-green-500' },
  { value: 'material', label: 'Material', icon: Layers, color: 'bg-orange-500' },
  { value: 'color', label: 'Color', icon: Palette, color: 'bg-purple-500' }
];

const dateFormats = [
  { value: 'YYMMDD', label: 'YYMMDD (e.g., 260131)' },
  { value: 'YYYYMMDD', label: 'YYYYMMDD (e.g., 20260131)' },
  { value: 'YYMM', label: 'YYMM (e.g., 2601)' }
];

const separators = [
  { value: '-', label: 'Dash (-)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '.', label: 'Dot (.)' },
  { value: 'none', label: 'None' }
];

const CodeConfigurationPage = () => {
  const { api } = useAuth();
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [previews, setPreviews] = useState({});

  const fetchConfigs = useCallback(async () => {
    try {
      const promises = entityTypes.map(et => 
        api.get(`/code-config/${et.value}`).then(res => ({ type: et.value, data: res.data }))
      );
      const results = await Promise.all(promises);
      const configMap = {};
      results.forEach(r => {
        configMap[r.type] = r.data;
      });
      setConfigs(configMap);
      
      // Generate previews
      const previewMap = {};
      results.forEach(r => {
        previewMap[r.type] = generatePreview(r.data);
      });
      setPreviews(previewMap);
    } catch (error) {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const generatePreview = (config) => {
    if (!config) return '---';
    const separator = config.separator === 'none' ? '' : (config.separator || '-');
    const parts = [config.prefix || 'XXX'];
    if (config.include_date) {
      const now = new Date();
      if (config.date_format === 'YYMMDD') {
        parts.push(now.toISOString().slice(2, 10).replace(/-/g, '').slice(0, 6));
      } else if (config.date_format === 'YYYYMMDD') {
        parts.push(now.toISOString().slice(0, 10).replace(/-/g, ''));
      } else if (config.date_format === 'YYMM') {
        parts.push(now.toISOString().slice(2, 7).replace(/-/g, ''));
      }
    }
    const seq = String(config.current_sequence || config.sequence_start || 1).padStart(config.sequence_digits || 4, '0');
    parts.push(seq);
    return parts.join(separator);
  };

  const updateConfig = (entityType, field, value) => {
    const newConfig = { ...configs[entityType], [field]: value };
    setConfigs({ ...configs, [entityType]: newConfig });
    setPreviews({ ...previews, [entityType]: generatePreview(newConfig) });
  };

  const handleSave = async (entityType) => {
    setSaving({ ...saving, [entityType]: true });
    try {
      const config = configs[entityType];
      await api.post('/code-config', {
        entity_type: entityType,
        prefix: config.prefix,
        separator: config.separator,
        include_date: config.include_date,
        date_format: config.date_format,
        sequence_digits: config.sequence_digits,
        sequence_start: config.sequence_start
      });
      toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} code configuration saved`);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving({ ...saving, [entityType]: false });
    }
  };

  const generateTestCode = async (entityType) => {
    try {
      const response = await api.post(`/code-config/${entityType}/generate`);
      toast.success(`Generated code: ${response.data.code}`);
      fetchConfigs(); // Refresh to get updated sequence
    } catch (error) {
      toast.error('Failed to generate code');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="code-config-page">
      <div>
        <h1 className="text-2xl font-bold font-['Public_Sans']">Code Configuration</h1>
        <p className="text-muted-foreground">Configure automatic code generation for different entities</p>
      </div>

      <Tabs defaultValue="asset" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          {entityTypes.map(et => (
            <TabsTrigger key={et.value} value={et.value} className="gap-2">
              <et.icon className="h-4 w-4" />
              {et.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {entityTypes.map(et => {
          const config = configs[et.value] || {};
          return (
            <TabsContent key={et.value} value={et.value}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Configuration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <et.icon className="h-5 w-5" />
                      {et.label} Code Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how {et.label.toLowerCase()} codes are generated
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prefix</Label>
                        <Input
                          value={config.prefix || ''}
                          onChange={(e) => updateConfig(et.value, 'prefix', e.target.value.toUpperCase())}
                          placeholder="e.g., AST"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Separator</Label>
                        <Select
                          value={config.separator ?? '-'}
                          onValueChange={(v) => updateConfig(et.value, 'separator', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {separators.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Include Date</Label>
                        <p className="text-sm text-muted-foreground">
                          Add date component to the code
                        </p>
                      </div>
                      <Switch
                        checked={config.include_date || false}
                        onCheckedChange={(v) => updateConfig(et.value, 'include_date', v)}
                      />
                    </div>

                    {config.include_date && (
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select
                          value={config.date_format || 'YYMMDD'}
                          onValueChange={(v) => updateConfig(et.value, 'date_format', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dateFormats.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sequence Digits</Label>
                        <Select
                          value={String(config.sequence_digits || 4)}
                          onValueChange={(v) => updateConfig(et.value, 'sequence_digits', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[3, 4, 5, 6].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} digits</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Starting Number</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.sequence_start || 1}
                          onChange={(e) => updateConfig(et.value, 'sequence_start', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleSave(et.value)} 
                      disabled={saving[et.value]}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving[et.value] ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Code Preview
                    </CardTitle>
                    <CardDescription>
                      Preview of the next generated code
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg bg-muted p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Next Code</p>
                      <p className="text-3xl font-mono font-bold tracking-wider">
                        {previews[et.value] || '---'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Code Structure</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{config.prefix || 'PREFIX'}</Badge>
                        {config.include_date && (
                          <>
                            <span className="text-muted-foreground">{config.separator || '-'}</span>
                            <Badge variant="outline">{config.date_format || 'DATE'}</Badge>
                          </>
                        )}
                        <span className="text-muted-foreground">{config.separator || '-'}</span>
                        <Badge variant="outline">{'0'.repeat(config.sequence_digits || 4)}</Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-3">
                        Current Sequence: <span className="font-mono font-bold">{config.current_sequence || 1}</span>
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => generateTestCode(et.value)}
                        className="w-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Test Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default CodeConfigurationPage;
