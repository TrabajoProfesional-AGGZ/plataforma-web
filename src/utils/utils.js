import { auth } from '../firebase';

/**
 * Sanitiza una URL de imagen antes de renderizarla: solo permite `https://`.
 * Rechaza `http://`, `javascript:`, `data:` u otras URLs malformadas (defensa en profundidad).
 * @param {string} url
 * @returns {string|null} La URL si es segura, `null` en caso contrario.
 */
export function urlImagenSegura(url) {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Hace un fetch autenticado al API Gateway, adjuntando el ID token de Firebase del usuario actual.
 * @param {string} path - Ruta relativa a `REACT_APP_API_BASE_URL`.
 * @param {string} method - Método HTTP.
 * @param {object|null} [body] - Body a serializar como JSON.
 * @returns {Promise<Response>}
 */
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
