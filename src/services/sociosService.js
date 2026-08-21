import { fetchTo } from '../utils/utils';

// Fetch de socios en curso, compartido entre llamadores concurrentes (ver getSocios).
let sociosEnCurso = null;

/** Trae todas las páginas de socios desde el backend, notificando a `listeners` tras cada página. */
async function fetchTodasLasPaginasDeSocios(listeners) {
  const limite = 100;
  let pagina = 1;
  let socios = [];
  while (true) {
    const res = await fetchTo(`/api/v1/socios?pagina=${pagina}&limite=${limite}`, 'GET');
    if (res.status >= 500) throw new Error('servicio-no-disponible');
    if (!res.ok) throw new Error('Error al obtener socios');
    const data = await res.json();
    const socioPagina = data.socios ?? data;
    if (!Array.isArray(socioPagina)) return socioPagina;
    socios = socios.concat(socioPagina);
    for (const onPage of listeners) onPage(socios);
    if (socioPagina.length < limite) break;
    pagina++;
  }
  return socios;
}

/**
 * Trae todos los socios paginando contra el backend; `onPage` se invoca tras cada página.
 * Si ya hay una secuencia en curso (ej. doble invocación de StrictMode), los llamadores
 * concurrentes se enganchan a ella en vez de disparar un fetch propio.
 */
export async function getSocios({ onPage } = {}) {
  if (sociosEnCurso) {
    if (onPage) sociosEnCurso.listeners.add(onPage);
    return sociosEnCurso.promise;
  }

  const listeners = new Set(onPage ? [onPage] : []);
  const promise = fetchTodasLasPaginasDeSocios(listeners).finally(() => {
    sociosEnCurso = null;
  });
  sociosEnCurso = { promise, listeners };
  return promise;
}

/** Crea un socio nuevo. */
export async function createSocio(data) {
  const res = await fetchTo('/api/v1/socios', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('socio-duplicado');
  if (!res.ok) throw new Error('Error al crear socio');
  return res.json();
}

/** Modifica los datos de un socio existente. */
export async function updateSocio(id, data) {
  const res = await fetchTo(`/api/v1/socios/${encodeURIComponent(id)}`, 'PATCH', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al modificar socio');
  return res.json();
}

/** Elimina un socio por id. */
export async function deleteSocio(id) {
  const res = await fetchTo(`/api/v1/socios/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al eliminar socio');
}

/** Busca un socio por su número de socio. */
export async function getSocioByNroSocio(nroSocio) {
  const res = await fetchTo(`/api/v1/socios/por-nro-socio/${encodeURIComponent(nroSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar socio');
  return res.json();
}

/** Busca un socio por su email. */
export async function getSocioByEmail(email) {
  const res = await fetchTo(`/api/v1/socios/por-email/${encodeURIComponent(email)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar socio');
  return res.json();
}

/** Busca un socio por su UUID. */
export async function getSocioById(id) {
  const res = await fetchTo(`/api/v1/socios/${encodeURIComponent(id)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('socio-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar socio');
  return res.json();
}

/** Busca un socio por N° de socio, email o UUID según el formato del valor ingresado. */
export async function buscarSocioPorTexto(valor) {
  const v = valor.trim();
  if (v.includes('@')) return getSocioByEmail(v);
  const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  if (esUuid) return getSocioById(v);
  return getSocioByNroSocio(v);
}
