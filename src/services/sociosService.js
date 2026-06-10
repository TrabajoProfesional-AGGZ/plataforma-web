import { fetchTo } from '../utils/utils';

export async function getSocios() {
  const res = await fetchTo('/api/v1/socios?pagina=1&limite=100', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener socios');
  const data = await res.json();
  return data.socios ?? data;
}
