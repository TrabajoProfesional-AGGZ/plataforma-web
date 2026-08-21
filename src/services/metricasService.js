import { fetchTo } from '../utils/utils';

/** Obtiene el ranking de disciplinas con más socios inscriptos. */
export async function getTopDisciplinas(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/disciplinas/top?limite=${encodeURIComponent(limite)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de disciplinas');
  return res.json();
}

/** Obtiene el porcentaje de ocupación de instalaciones en los últimos `dias`. */
export async function getOcupacionInstalaciones(dias = 30) {
  const res = await fetchTo(`/api/v1/metricas/instalaciones/ocupacion?dias=${encodeURIComponent(dias)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ocupación de instalaciones');
  return res.json();
}

/** Obtiene el ranking de eventos por entradas vendidas y ocupación. */
export async function getTopEventos(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/eventos/top?limite=${encodeURIComponent(limite)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de eventos');
  return res.json();
}

/** Obtiene el ranking de productos más vendidos. */
export async function getTopProductos(limite = 5) {
  const res = await fetchTo(`/api/v1/metricas/productos/top?limite=${encodeURIComponent(limite)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener ranking de productos');
  return res.json();
}

/** Obtiene el desglose de pagos marcados como pagados en caja por tipo (cuota/reserva/entrada/compra). */
export async function getPagosEnCaja() {
  const res = await fetchTo('/api/v1/metricas/pagos-caja', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener pagos en caja');
  return res.json();
}

/** Obtiene el dashboard de métricas financieras, opcionalmente filtrado por período. */
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
