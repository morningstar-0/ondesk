import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AssetsPage from "./pages/AssetsPage";
import ProductsPage from "./pages/ProductsPage";
import ColorsLibraryPage from "./pages/ColorsLibraryPage";
import SizesLibraryPage from "./pages/SizesLibraryPage";
import CustomFieldsLibraryPage from "./pages/CustomFieldsLibraryPage";
import SuppliersLibraryPage from "./pages/SuppliersLibraryPage";
import BuyersLibraryPage from "./pages/BuyersLibraryPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";

// Layout
import DashboardLayout from "./components/DashboardLayout";

const ProtectedRoute = ({ children }) => {
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
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <AssetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraries/colors"
        element={
          <ProtectedRoute>
            <ColorsLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraries/sizes"
        element={
          <ProtectedRoute>
            <SizesLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraries/custom-fields"
        element={
          <ProtectedRoute>
            <CustomFieldsLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraries/suppliers"
        element={
          <ProtectedRoute>
            <SuppliersLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/libraries/buyers"
        element={
          <ProtectedRoute>
            <BuyersLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/form-builder"
        element={
          <ProtectedRoute>
            <FormBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch-all redirect */}
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
