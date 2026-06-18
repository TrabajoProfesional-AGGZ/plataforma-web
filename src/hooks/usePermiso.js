import { useAuth } from './useAuth';

export function usePermiso(nombre) {
  const { permisos } = useAuth();
  return permisos.includes(nombre);
}
