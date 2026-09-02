import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import Products from '../pages/products/Products';
import Categories from '../pages/categories/Categories';
import Inventory from '../pages/inventory/Inventory';
import Customers from '../pages/customers/Customers';
import Suppliers from '../pages/suppliers/Suppliers';
import Stores from '../pages/stores/Stores';
import Settings from '../pages/settings/Settings';
import POS from '../pages/pos/POS';
import Orders from '../pages/orders/Orders';
import Purchases from '../pages/purchases/Purchases';
import StaffAndRoles from '../pages/rbac/StaffAndRoles';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../utils/rbac';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PermissionRoute = ({ permission, children }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission(user, permission)) {
    const fallback = hasPermission(user, 'view_dashboard') ? '/' : '/pos';
    return <Navigate to={fallback} replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={
          <PermissionRoute permission="view_dashboard">
            <Dashboard />
          </PermissionRoute>
        } />
        <Route path="pos" element={
          <PermissionRoute permission="manage_pos">
            <POS />
          </PermissionRoute>
        } />
        <Route path="products" element={
          <PermissionRoute permission="view_products">
            <Products />
          </PermissionRoute>
        } />
        <Route path="categories" element={
          <PermissionRoute permission="view_products">
            <Categories />
          </PermissionRoute>
        } />
        <Route path="inventory" element={
          <PermissionRoute permission="view_inventory">
            <Inventory />
          </PermissionRoute>
        } />
        <Route path="orders" element={
          <PermissionRoute permission="view_orders">
            <Orders />
          </PermissionRoute>
        } />
        <Route path="purchases" element={
          <PermissionRoute permission="view_purchases">
            <Purchases />
          </PermissionRoute>
        } />
        <Route path="customers" element={
          <PermissionRoute permission="view_customers">
            <Customers />
          </PermissionRoute>
        } />
        <Route path="suppliers" element={
          <PermissionRoute permission="view_suppliers">
            <Suppliers />
          </PermissionRoute>
        } />
        <Route path="stores" element={
          <PermissionRoute permission="view_stores">
            <Stores />
          </PermissionRoute>
        } />
        <Route path="staff-roles" element={
          <PermissionRoute permission="manage_users">
            <StaffAndRoles />
          </PermissionRoute>
        } />
        <Route path="settings" element={
          <PermissionRoute permission="manage_settings">
            <Settings />
          </PermissionRoute>
        } />
      </Route>
    </Routes>
  );
}
