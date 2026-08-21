import { fetchTo } from '../utils/utils';

/** Obtiene el catálogo de roles administrativos. */
export async function fetchRoles() {
  const res = await fetchTo('/api/v1/roles', 'GET');
  if (!res.ok) throw new Error('Error al obtener roles');
  return res.json();
}
