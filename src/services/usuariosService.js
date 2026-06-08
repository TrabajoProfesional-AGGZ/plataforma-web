import { auth } from '../firebase';

export async function getUsers() {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
}

export async function updateUserRole(uid, newRole) {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(
    `${process.env.REACT_APP_API_BASE_URL}/admin/users/${uid}/role`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    }
  );
  if (!res.ok) throw new Error('Error al actualizar rol');
}

export async function createUser(email, password, role) {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}
