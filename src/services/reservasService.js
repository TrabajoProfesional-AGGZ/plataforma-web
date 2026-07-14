import { fetchTo } from '../utils/utils';

async function fetchReservas(url, errorMsg = 'Error al obtener reservas') {
  const res = await fetchTo(url, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error(errorMsg);
  const data = await res.json();
  return data.reservas ?? data;
}

export async function getReservas(instalacionId) {
  const res = await fetchTo('/api/v1/reservas', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener reservas');
  const data = await res.json();
  const todas = data.reservas ?? data;
  return todas.filter((r) => (r.id_instalacion ?? r.instalacion_id) === instalacionId);
}

export async function getReservasPorInstalacion(instalacionId) {
  return fetchReservas(`/api/v1/reservas/por-instalacion/${encodeURIComponent(instalacionId)}`);
}

export async function getReservasPorSocio(nroSocio) {
  return fetchReservas(`/api/v1/reservas/por-socio/${encodeURIComponent(nroSocio)}`);
}

export async function createReserva(data) {
  const res = await fetchTo('/api/v1/reservas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('superposicion');
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    throw new Error(tipo === 'suspendido' ? 'socio-suspendido' : 'socio-moroso');
  }
  if (!res.ok) throw new Error('Error al crear reserva');
  return res.json();
}

export async function getTurnosDisponibles(idInstalacion, fecha) {
  const res = await fetchTo(
    `/api/v1/reservas/turnos-disponibles/${encodeURIComponent(idInstalacion)}?fecha=${encodeURIComponent(fecha)}`,
    'GET'
  );
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener turnos disponibles');
  return res.json();
}

export async function deleteReserva(instalacionId, reservaId) {
  const res = await fetchTo(`/api/v1/reservas/${encodeURIComponent(reservaId)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar reserva');
}

export async function getReservasHistoricas() {
  return fetchReservas('/api/v1/reservas/historicas', 'Error al obtener reservas históricas');
}

export async function getReservasHistoricasPorInstalacion(instalacionId) {
  return fetchReservas(`/api/v1/reservas/historicas/por-instalacion/${encodeURIComponent(instalacionId)}`, 'Error al obtener reservas históricas');
}
