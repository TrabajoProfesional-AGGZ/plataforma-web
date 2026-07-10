import { fetchTo } from '../utils/utils';

export async function getSocios() {
  const res = await fetchTo('/api/v1/socios?pagina=1&limite=100', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener socios');
  const data = await res.json();
  return data.socios ?? data;
}

export async function createSocio(data) {
  const res = await fetchTo('/api/v1/socios', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('socio-duplicado');
  if (!res.ok) throw new Error('Error al crear socio');
  return res.json();
}

export async function updateSocio(id, data) {
  const res = await fetchTo(`/api/v1/socios/${encodeURIComponent(id)}`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al modificar socio');
  return res.json();
}

export async function deleteSocio(id) {
  const res = await fetchTo(`/api/v1/socios/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar socio');
}

export async function getSocioByNroSocio(nroSocio) {
  const res = await fetchTo(`/api/v1/socios/por-nro-socio/${encodeURIComponent(nroSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar socio');
  return res.json();
}
