import { useAuth } from './useAuth';

/**
 * Chequea si el usuario autenticado tiene un permiso dado.
 * @param {string} nombre - Nombre del permiso (ver `src/utils/permisoLabels.js`).
 * @returns {boolean}
 */
export function usePermiso(nombre) {
  const { permisos } = useAuth();
  return permisos.includes(nombre);
}
