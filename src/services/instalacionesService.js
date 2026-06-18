import { fetchTo } from '../utils/utils';

export async function getInstalaciones() {
  const res = await fetchTo('/api/v1/instalaciones', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener instalaciones');
  const data = await res.json();
  return data.instalaciones ?? data;
}

export async function createInstalacion(data) {
  const res = await fetchTo('/api/v1/instalaciones', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear instalación');
  return res.json();
}

export async function deleteInstalacion(id) {
  const res = await fetchTo(`/api/v1/instalaciones/${id}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar instalación');
}
