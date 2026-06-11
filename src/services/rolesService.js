import { fetchTo } from '../utils/utils';

export async function fetchRoles() {
  const res = await fetchTo('/api/v1/roles', 'GET');
  if (!res.ok) throw new Error('Error al obtener roles');
  return res.json();
}
