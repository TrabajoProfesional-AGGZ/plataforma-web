import { fetchTo } from '../utils/utils';

export async function fetchUsuarios() {
  const res = await fetchTo('/api/v1/usuarios?pagina=1&limite=100', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener usuarios');
  const data = await res.json();
  return data.usuarios ?? data;
}

export async function crearUsuario(datos) {
  const res = await fetchTo('/api/v1/auth/registrar', 'POST', datos);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('usuario-duplicado');
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}

export async function editarUsuario(id, datos) {
  const res = await fetchTo(`/api/v1/usuarios/${id}`, 'PATCH', datos);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al modificar usuario');
  return res.json();
}

export async function cambiarRolUsuario(id, rol) {
  const res = await fetchTo(`/api/v1/auth/usuarios/${id}/rol`, 'PATCH', { rol });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al cambiar rol');
  return res.json();
}

export async function eliminarUsuario(id) {
  const res = await fetchTo(`/api/v1/usuarios/${id}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar usuario');
}
