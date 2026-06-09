import { fetchTo } from '../utils/utils';

export async function getUsers() {
  const res = await fetchTo('/admin/users', 'GET');
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
}

export async function updateUserRole(uid, newRole) {
  const res = await fetchTo(`/admin/users/${uid}/role`, 'PATCH', { role: newRole });
  if (!res.ok) throw new Error('Error al actualizar rol');
}

export async function createUser(email, password, role) {
  const res = await fetchTo('/admin/users', 'POST', { email, password, role });
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}
