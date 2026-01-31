import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AssetsPage from "./pages/AssetsPage";
import AssetDetailPage from "./pages/AssetDetailPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import ColorsLibraryPage from "./pages/ColorsLibraryPage";
import SizesLibraryPage from "./pages/SizesLibraryPage";
import CustomFieldsLibraryPage from "./pages/CustomFieldsLibraryPage";
import SuppliersLibraryPage from "./pages/SuppliersLibraryPage";
import BuyersLibraryPage from "./pages/BuyersLibraryPage";
import POMLibraryPage from "./pages/POMLibraryPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import CodeConfigurationPage from "./pages/CodeConfigurationPage";

// Layout
import DashboardLayout from "./components/DashboardLayout";

const ProtectedRoute = ({ children, fullWidth = false }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (fullWidth) {
    return children;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* Assets */}
      <Route path="/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/assets/:id" element={<ProtectedRoute fullWidth><AssetDetailPage /></ProtectedRoute>} />

      {/* Products */}
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute fullWidth><ProductDetailPage /></ProtectedRoute>} />

      {/* Materials */}
      <Route path="/materials" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
      <Route path="/materials/:id" element={<ProtectedRoute fullWidth><MaterialDetailPage /></ProtectedRoute>} />

      {/* Libraries */}
      <Route path="/libraries/colors" element={<ProtectedRoute><ColorsLibraryPage /></ProtectedRoute>} />
      <Route path="/libraries/sizes" element={<ProtectedRoute><SizesLibraryPage /></ProtectedRoute>} />
      <Route path="/libraries/custom-fields" element={<ProtectedRoute><CustomFieldsLibraryPage /></ProtectedRoute>} />
      <Route path="/libraries/suppliers" element={<ProtectedRoute><SuppliersLibraryPage /></ProtectedRoute>} />
      <Route path="/libraries/buyers" element={<ProtectedRoute><BuyersLibraryPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/form-builder" element={<ProtectedRoute><FormBuilderPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
