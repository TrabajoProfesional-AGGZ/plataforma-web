import { fetchTo } from '../utils/utils';

export async function getDashboardFidelizacion() {
  const res = await fetchTo('/api/v1/analiticas/fidelizacion', 'GET');
  if (res.status === 401 || res.status === 403) throw new Error('no-autorizado');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener las métricas de morosidad');
  return res.json();
}
