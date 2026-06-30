import { fetchTo } from '../utils/utils';

export async function getNoticias() {
  const res = await fetchTo('/api/v1/noticias/vigentes', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener noticias');
  return res.json();
}

export async function getNoticiasHistoricas() {
  const res = await fetchTo('/api/v1/noticias', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener noticias históricas');
  return res.json();
}

export async function getNoticia(id) {
  const res = await fetchTo(`/api/v1/noticias/${id}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener la noticia');
  return res.json();
}

export async function createNoticia(data) {
  const res = await fetchTo('/api/v1/noticias', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear noticia');
  return res.json();
}

export async function editarNoticia(id, data) {
  const res = await fetchTo(`/api/v1/noticias/${id}`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al editar noticia');
  return res.json();
}

export async function borrarNoticia(id) {
  const res = await fetchTo(`/api/v1/noticias/${id}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al borrar noticia');
}
