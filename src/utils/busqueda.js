/**
 * Utilidades de búsqueda en vivo (F6). Módulo sin dependencias a propósito:
 * `utils.js` importa `firebase.js`, y las páginas que solo necesitan esto no
 * deberían arrastrar Firebase (ni su mock) a sus tests.
 */

/**
 * Normaliza texto para comparar búsquedas: minúsculas, sin tildes/diacríticos
 * y sin espacios sobrantes ("  Pérez " → "perez"). Usado por la búsqueda en
 * vivo de Socios/Usuarios para que "perez" encuentre a "Pérez".
 * @param {unknown} texto
 * @returns {string}
 */
export function normalizarBusqueda(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
