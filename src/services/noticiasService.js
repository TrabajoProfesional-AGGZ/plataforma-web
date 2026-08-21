import { fetchTo } from '../utils/utils';

/** Obtiene el listado de noticias vigentes. */
export async function getNoticias() {
  const res = await fetchTo('/api/v1/noticias/vigentes', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener noticias');
  return res.json();
}

/** Obtiene el listado completo de noticias, incluyendo las no vigentes. */
export async function getNoticiasHistoricas() {
  const res = await fetchTo('/api/v1/noticias', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener noticias históricas');
  return res.json();
}

/** Obtiene el detalle completo de una noticia por id. */
export async function getNoticia(id) {
  const res = await fetchTo(`/api/v1/noticias/${encodeURIComponent(id)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener la noticia');
  return res.json();
}

/** Sube la imagen de una noticia a Cloudinary. */
export async function subirImagenNoticia(imagenBase64, tituloFoto) {
  const res = await fetchTo('/api/v1/noticias/imagen', 'POST', {
    imagen_base64: imagenBase64,
    titulo_foto: tituloFoto || null,
  });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir la imagen');
  return res.json();
}

/** Crea una noticia nueva. */
export async function createNoticia(data) {
  const res = await fetchTo('/api/v1/noticias', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear noticia');
  return res.json();
}

/** Edita una noticia existente. */
export async function editarNoticia(id, data) {
  const res = await fetchTo(`/api/v1/noticias/${encodeURIComponent(id)}`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al editar noticia');
  return res.json();
}

/** Borra una noticia por id. */
export async function borrarNoticia(id) {
  const res = await fetchTo(`/api/v1/noticias/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al borrar noticia');
}
