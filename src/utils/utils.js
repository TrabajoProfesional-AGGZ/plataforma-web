import { auth } from '../firebase';

export function urlImagenSegura(url) {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export async function fetchTo(path, method, body = null) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(`${process.env.REACT_APP_API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });
}
