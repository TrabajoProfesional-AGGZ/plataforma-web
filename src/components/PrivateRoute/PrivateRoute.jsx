import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

/**
 * Guard de ruta: muestra `LoadingScreen` mientras se resuelve la auth, redirige
 * a `/` si no hay usuario logueado, y a `/dashboard` si se pasa `requiredPermiso`
 * y el usuario no lo tiene. Si pasa ambas validaciones, renderiza el `Outlet`.
 */
function PrivateRoute({ requiredPermiso }) {
  const { user, loading, permisos } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (requiredPermiso && !permisos.includes(requiredPermiso)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default PrivateRoute;
