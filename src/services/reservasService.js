import { fetchTo } from '../utils/utils';

/** Hace un GET a `url` y devuelve el array de reservas de la respuesta. */
async function fetchReservas(url, errorMsg = 'Error al obtener reservas') {
  const res = await fetchTo(url, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error(errorMsg);
  const data = await res.json();
  return data.reservas ?? data;
}

/** Obtiene las reservas vigentes de una instalación. */
export async function getReservasPorInstalacion(instalacionId) {
  return fetchReservas(`/api/v1/reservas/por-instalacion/${encodeURIComponent(instalacionId)}`);
}

/** Alias de `getReservasPorInstalacion`. */
export async function getReservas(instalacionId) {
  return getReservasPorInstalacion(instalacionId);
}

/** Obtiene las reservas de un socio por número de socio. */
export async function getReservasPorSocio(nroSocio) {
  return fetchReservas(`/api/v1/reservas/por-socio/${encodeURIComponent(nroSocio)}`);
}

/** Crea una reserva nueva. */
export async function createReserva(data) {
  const res = await fetchTo('/api/v1/reservas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) {
    const body = await res.json?.().catch(() => null);
    const tipo = body?.detail?.tipo;
    if (tipo === 'sin_cupo') {
      const error = new Error('sin-cupo');
      error.cuposDisponibles = body?.detail?.cupos_disponibles ?? null;
      throw error;
    }
    if (tipo === 'conflicto_temporal') throw new Error('conflicto-temporal');
    throw new Error('superposicion');
  }
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    throw new Error(tipo === 'suspendido' ? 'socio-suspendido' : 'socio-moroso');
  }
  if (!res.ok) throw new Error('Error al crear reserva');
  return res.json();
}

/** Obtiene los turnos disponibles de una instalación en una fecha, con cupos por turno. */
export async function getTurnosDisponibles(idInstalacion, fecha) {
  const res = await fetchTo(
    `/api/v1/reservas/turnos-disponibles/${encodeURIComponent(idInstalacion)}?fecha=${encodeURIComponent(fecha)}`,
    'GET'
  );
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener turnos disponibles');
  return res.json();
}

/** Elimina una reserva por id. */
export async function deleteReserva(instalacionId, reservaId) {
  const res = await fetchTo(`/api/v1/reservas/${encodeURIComponent(reservaId)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar reserva');
}

/** Obtiene el listado completo de reservas históricas. */
export async function getReservasHistoricas() {
  return fetchReservas('/api/v1/reservas/historicas', 'Error al obtener reservas históricas');
}

/** Obtiene las reservas históricas de una instalación. */
export async function getReservasHistoricasPorInstalacion(instalacionId) {
  return fetchReservas(`/api/v1/reservas/historicas/por-instalacion/${encodeURIComponent(instalacionId)}`, 'Error al obtener reservas históricas');
}
