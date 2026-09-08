import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import StoreDashboard from './pages/store/StoreDashboard';
import StoreInvoiceDetailPage from './pages/store/InvoiceDetailPage';
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import AccountsInvoiceDetailPage from './pages/accounts/InvoiceDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInvoiceList from './pages/admin/AdminInvoiceList';
import AdminInvoiceDetailPage from './pages/admin/AdminInvoiceDetailPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function RoleBasedRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roleHome = { store_officer: '/store', accounts_officer: '/accounts', admin: '/admin' };
  return <Navigate to={roleHome[user?.role] || '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Store Officer */}
        <Route element={<ProtectedRoute allowedRoles={['store_officer']} />}>
          <Route element={<AppLayout />}>
            <Route path="/store" element={<StoreDashboard />} />
            <Route path="/store/invoices/:id" element={<StoreInvoiceDetailPage />} />
          </Route>
        </Route>

        {/* Accounts Officer */}
        <Route element={<ProtectedRoute allowedRoles={['accounts_officer']} />}>
          <Route element={<AppLayout />}>
            <Route path="/accounts" element={<AccountsDashboard />} />
            <Route path="/accounts/invoices/:id" element={<AccountsInvoiceDetailPage />} />
          </Route>
        </Route>

        {/* Admin / HQ */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/invoices" element={<AdminInvoiceList />} />
            <Route path="/admin/invoices/:id" element={<AdminInvoiceDetailPage />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
