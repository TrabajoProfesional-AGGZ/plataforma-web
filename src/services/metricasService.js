import { fetchTo } from '../utils/utils';

export async function getTopDisciplinas(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/disciplinas/top?limite=${limite}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de disciplinas');
  return res.json();
}

export async function getOcupacionInstalaciones(dias = 30) {
  const res = await fetchTo(`/api/v1/metricas/instalaciones/ocupacion?dias=${dias}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ocupación de instalaciones');
  return res.json();
}