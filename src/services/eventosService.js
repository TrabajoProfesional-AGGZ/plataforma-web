import { fetchTo } from '../utils/utils';

export async function getEventos() {
  const res = await fetchTo('/api/v1/eventos', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener eventos');
  return res.json();
}

export async function subirImagenEvento(imagenBase64, tituloFoto) {
  const res = await fetchTo('/api/v1/eventos/imagen', 'POST', {
    imagen_base64: imagenBase64,
    titulo_foto: tituloFoto || null,
  });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir la imagen');
  return res.json();
}

export async function createEvento(data) {
  const res = await fetchTo('/api/v1/eventos', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear evento');
  return res.json();
}
