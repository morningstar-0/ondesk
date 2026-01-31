import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Menu, 
  Home, 
  Package, 
  Box, 
  Layers, 
  Palette, 
  Ruler, 
  Users, 
  Truck, 
  Settings,
  ExternalLink,
  X,
  ChevronLeft
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/assets', icon: Box, label: 'Assets' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/materials', icon: Layers, label: 'Materials' },
  { type: 'divider', label: 'Libraries' },
  { path: '/libraries/colors', icon: Palette, label: 'Colors' },
  { path: '/libraries/sizes', icon: Ruler, label: 'Sizes' },
  { path: '/libraries/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/libraries/buyers', icon: Users, label: 'Buyers' },
  { type: 'divider', label: 'Admin' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

const FullScreenHeader = ({ 
  title, 
  subtitle, 
  backPath, 
  backLabel = 'Back',
  children,
  badge
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Menu Button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">AssetFlow</span>
                  </div>
                </div>
                <nav className="flex-1 py-4 overflow-y-auto">
                  {navItems.map((item, idx) => (
                    item.type === 'divider' ? (
                      <div key={idx} className="px-4 py-2 mt-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                    ) : (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )
                  ))}
                </nav>
                <div className="p-4 border-t">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Back Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(backPath)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go back to {backLabel}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Divider */}
          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground font-mono truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Open in New Tab */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenNewTab}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">New Tab</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in new tab</p>
                <p className="text-xs text-muted-foreground">Ctrl/Cmd + Click on any link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Additional Actions */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default FullScreenHeader;
