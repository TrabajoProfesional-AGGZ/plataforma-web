import { useAuthContext } from '../context/AuthContext';

/**
 * Hook de acceso al estado de autenticación (usuario, rol, permisos, datos del usuario).
 * @returns {{ user: object|null, loading: boolean, role: string|null, permisos: string[], userData: object|null }}
 */
export function useAuth() {
  return useAuthContext();
}
