import { fetchTo } from '../utils/utils';

export async function getReservas(instalacionId) {
  const res = await fetchTo('/api/v1/reservas', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener reservas');
  const data = await res.json();
  const todas = data.reservas ?? data;
  return todas.filter((r) => (r.id_instalacion ?? r.instalacion_id) === instalacionId);
}

export async function createReserva(data) {
  const res = await fetchTo('/api/v1/reservas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear reserva');
  return res.json();
}

export async function deleteReserva(instalacionId, reservaId) {
  const res = await fetchTo(`/api/v1/reservas/${reservaId}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar reserva');
}
