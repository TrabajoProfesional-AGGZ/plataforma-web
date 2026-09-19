import { auth } from '../firebase';

/**
 * Base del API Gateway. Vive acá y se exporta porque había **dos** lecturas separadas de la misma
 * variable —esta y una copia en `AuthContext`—, y con la resolución del club por hostname iban a
 * ser tres. Es CRA, así que la variable es `process.env.REACT_APP_*` y no `import.meta.env.VITE_*`
 * como en las PWAs: copiar un servicio de un repo al otro rompe la config en silencio.
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

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
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });
}

/**
 * Igual que `fetchTo` pero sin el ID token, para los endpoints que se piden antes del login.
 * Hoy el único es la resolución del club por hostname, que corre justamente cuando todavía no
 * hay sesión: mandarle un `Authorization: Bearer undefined` sería ruido.
 * @param {string} path - Ruta relativa a `API_BASE_URL`.
 * @param {string} method - Método HTTP.
 * @param {object|null} [body] - Body a serializar como JSON.
 * @returns {Promise<Response>}
 */
export async function fetchWithOutAuth(path, method, body = null) {
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });
}
