import { fetchTo } from '../utils/utils';

export async function getTramitesPorSocio(idSocio) {
  const res = await fetchTo(`/api/v1/tramites/por-socio/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener los trámites');
  return res.json();
}

export async function getTramite(tramiteId) {
  const res = await fetchTo(`/api/v1/tramites/${encodeURIComponent(tramiteId)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener el trámite');
  return res.json();
}

export async function revisarTramite(tramiteId, data) {
  const res = await fetchTo(`/api/v1/tramites/${encodeURIComponent(tramiteId)}/revisar`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al revisar el trámite');
  return res.json();
}
