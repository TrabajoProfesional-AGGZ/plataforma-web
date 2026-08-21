import { fetchTo } from '../utils/utils';

/** Obtiene el catálogo de estados financieros de socio. */
export async function fetchEstadosSocio() {
  const res = await fetchTo('/api/v1/estados-socio', 'GET');
  if (!res.ok) throw new Error('Error al obtener estados');
  return res.json();
}

/** Obtiene el catálogo de categorías societarias. */
export async function fetchCategoriasSocio() {
  const res = await fetchTo('/api/v1/categorias-socio', 'GET');
  if (!res.ok) throw new Error('Error al obtener categorías');
  return res.json();
}

/** Obtiene el catálogo de sedes del club. */
export async function fetchSedes() {
  const res = await fetchTo('/api/v1/sedes', 'GET');
  if (!res.ok) throw new Error('Error al obtener sedes');
  return res.json();
}
