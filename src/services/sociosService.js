import { fetchTo } from '../utils/utils';

export async function getSocios() {
  const res = await fetchTo('/api/v1/socios', 'GET');
  if (!res.ok) throw new Error('Error al obtener socios');
  const data = await res.json();
  return data.socios ?? data;
}

export async function getSocioPorDni(dni) {
  const res = await fetchTo(`/api/v1/socios/${dni}`, 'GET');
  if (res.status === 404) throw new Error('no-encontrado');
  if (!res.ok) throw new Error('Error al obtener socio');
  return res.json();
}
