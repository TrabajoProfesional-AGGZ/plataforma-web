import { fetchTo } from '../utils/utils';

/** Obtiene el listado de eventos vigentes (no vencidos). */
export async function getEventos() {
  const res = await fetchTo('/api/v1/eventos', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener eventos');
  return res.json();
}

/** Obtiene el listado de eventos ya finalizados. */
export async function getEventosHistoricos() {
  const res = await fetchTo('/api/v1/eventos/historicos', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener eventos históricos');
  return res.json();
}

/** Sube la imagen de un evento a Cloudinary. */
export async function subirImagenEvento(imagenBase64, tituloFoto) {
  const res = await fetchTo('/api/v1/eventos/imagen', 'POST', {
    imagen_base64: imagenBase64,
    titulo_foto: tituloFoto || null,
  });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir la imagen');
  return res.json();
}

/** Crea un evento nuevo. */
export async function createEvento(data) {
  const res = await fetchTo('/api/v1/eventos', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear evento');
  return res.json();
}
