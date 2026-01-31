import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Save, Building2 } from 'lucide-react';

const SettingsPage = () => {
  const { api, tenant } = useAuth();
  const [settings, setSettings] = useState({
    company_name: '',
    logo_url: '',
    default_currency: 'USD',
    date_format: 'YYYY-MM-DD',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>Basic information about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Your Company Name"
                  data-testid="company-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://..."
                  data-testid="logo-url-input"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="default_currency">Default Currency</Label>
                <Select
                  value={settings.default_currency}
                  onValueChange={(value) => setSettings({ ...settings, default_currency: value })}
                >
                  <SelectTrigger data-testid="currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={settings.date_format}
                  onValueChange={(value) => setSettings({ ...settings, date_format: value })}
                >
                  <SelectTrigger data-testid="date-format-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger data-testid="timezone-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>Your current tenant details (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tenant Name</Label>
                <Input value={tenant?.name || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Tenant ID</Label>
                <Input value={tenant?.id || ''} disabled className="bg-muted font-mono text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} data-testid="save-settings-btn">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
