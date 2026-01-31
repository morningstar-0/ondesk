import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Boxes, ShoppingBag, Truck, Building2, Palette, Ruler } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];

const DashboardPage = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Assets', value: stats?.counts?.assets || 0, icon: Boxes, color: 'text-violet-600' },
    { title: 'Products', value: stats?.counts?.products || 0, icon: ShoppingBag, color: 'text-emerald-600' },
    { title: 'Suppliers', value: stats?.counts?.suppliers || 0, icon: Truck, color: 'text-blue-600' },
    { title: 'Buyers', value: stats?.counts?.buyers || 0, icon: Building2, color: 'text-amber-600' },
    { title: 'Colors', value: stats?.counts?.colors || 0, icon: Palette, color: 'text-pink-600' },
    { title: 'Sizes', value: stats?.counts?.sizes || 0, icon: Ruler, color: 'text-cyan-600' },
  ];

  const assetStatusData = Object.entries(stats?.assets_by_status || {}).map(([name, value]) => ({ name, value }));
  const productStatusData = Object.entries(stats?.products_by_status || {}).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold font-['Public_Sans'] tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your assets and products</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow" data-testid={`stat-${stat.title.toLowerCase()}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold font-['Public_Sans']">{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-['Public_Sans']">Assets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {assetStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No assets yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-['Public_Sans']">Products by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {productStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productStatusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No products yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-['Public_Sans']">Recent Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_assets?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{asset.sku}</p>
                    </div>
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent assets</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-['Public_Sans']">Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_products?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent products</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
