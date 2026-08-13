import { fetchTo } from '../utils/utils';

export async function getTopDisciplinas(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/disciplinas/top?limite=${encodeURIComponent(limite)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de disciplinas');
  return res.json();
}

export async function getOcupacionInstalaciones(dias = 30) {
  const res = await fetchTo(`/api/v1/metricas/instalaciones/ocupacion?dias=${encodeURIComponent(dias)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ocupación de instalaciones');
  return res.json();
}

export async function getTopEventos(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/eventos/top?limite=${encodeURIComponent(limite)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de eventos');
  return res.json();
}

export async function getTopProductos(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/productos/top?limite=${encodeURIComponent(limite)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de productos');
  return res.json();
}

export async function getPagosEnCaja() {
  const res = await fetchTo('/api/v1/metricas/pagos-caja', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener pagos en caja');
  return res.json();
}

export async function getDashboardFinanzas(periodo=null) {
    let url = ''
    if (periodo) {
        url = `/api/v1/metricas/finanzas?periodo=${encodeURIComponent(periodo)}`
    } else {
        url = '/api/v1/metricas/finanzas'
    }
    const res = await fetchTo(url, 'GET');
    if (res.status === 401 || res.status === 403) throw new Error('no-autorizado');
    if (res.status >= 500) throw new Error('servicio-no-disponible');
    if (!res.ok) throw new Error('Error al obtener métricas de finanzas');
    return res.json();
}
