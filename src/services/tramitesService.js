import { fetchTo } from '../utils/utils';

/** Obtiene el listado de trámites de un socio (sin el detalle completo). */
export async function getTramitesPorSocio(idSocio) {
  const res = await fetchTo(`/api/v1/tramites/por-socio/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener los trámites');
  return res.json();
}

/** Obtiene el detalle completo de un trámite, incluyendo el archivo adjunto. */
export async function getTramite(tramiteId) {
  const res = await fetchTo(`/api/v1/tramites/${encodeURIComponent(tramiteId)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener el trámite');
  return res.json();
}

/** Revisa un trámite en estado "en_revision", aprobándolo o rechazándolo. */
export async function revisarTramite(tramiteId, data) {
  const res = await fetchTo(`/api/v1/tramites/${encodeURIComponent(tramiteId)}/revisar`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al revisar el trámite');
  return res.json();
}
