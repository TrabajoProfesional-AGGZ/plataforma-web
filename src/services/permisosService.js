import { fetchTo } from '../utils/utils';

export async function fetchPermisos() {
  const res = await fetchTo('/api/v1/permisos', 'GET');
  if (!res.ok) throw new Error('Error al obtener permisos');
  return res.json();
}
