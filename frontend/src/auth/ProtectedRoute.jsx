import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's own dashboard if wrong role
    const roleHome = {
      store_officer: '/store',
      accounts_officer: '/accounts',
      admin: '/admin',
    };
    return <Navigate to={roleHome[user.role] || '/login'} replace />;
  }

  return <Outlet />;
}
