import { fetchTo } from '../utils/utils';

export async function getProductos() {
  const res = await fetchTo('/api/v1/productos', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function getProducto(id) {
  const res = await fetchTo(`/api/v1/productos/${encodeURIComponent(id)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener el producto');
  return res.json();
}

export async function subirImagenProducto(imagenBase64) {
  const res = await fetchTo('/api/v1/productos/imagen', 'POST', {
    imagen_base64: imagenBase64,
  });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al subir la imagen');
  return res.json();
}

export async function createProducto(data) {
  const res = await fetchTo('/api/v1/productos', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear producto');
  return res.json();
}

export async function editarProducto(id, data) {
  const res = await fetchTo(`/api/v1/productos/${encodeURIComponent(id)}`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al editar producto');
  return res.json();
}