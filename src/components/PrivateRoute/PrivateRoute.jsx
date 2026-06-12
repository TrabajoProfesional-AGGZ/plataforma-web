import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

function PrivateRoute({ requiredPermiso }) {
  const { user, loading, permisos } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (requiredPermiso && !permisos.includes(requiredPermiso)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default PrivateRoute;
