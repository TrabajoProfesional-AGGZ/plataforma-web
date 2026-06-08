import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

function PrivateRoute({ requiredRole }) {
  const { user, loading, role } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default PrivateRoute;
