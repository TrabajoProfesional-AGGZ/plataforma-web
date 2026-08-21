import { fetchTo } from '../utils/utils';

/** Obtiene el listado completo de alertas. */
export async function getAlertas() {
  const res = await fetchTo('/api/v1/alertas', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener alertas');
  return res.json();
}

/** Crea una alerta nueva. */
export async function createAlerta(data) {
  const res = await fetchTo('/api/v1/alertas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear alerta');
  return res.json();
}

/** Borra una alerta por id. */
export async function borrarAlerta(id) {
  const res = await fetchTo(`/api/v1/alertas/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al borrar alerta');
}
