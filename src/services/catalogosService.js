import { fetchTo } from '../utils/utils';

export async function fetchEstadosSocio() {
  const res = await fetchTo('/api/v1/estados-socio', 'GET');
  if (!res.ok) throw new Error('Error al obtener estados');
  return res.json();
}

export async function fetchCategoriasSocio() {
  const res = await fetchTo('/api/v1/categorias-socio', 'GET');
  if (!res.ok) throw new Error('Error al obtener categorías');
  return res.json();
}
