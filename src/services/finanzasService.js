import { fetchTo } from '../utils/utils';

const ENDPOINT_POR_TIPO = {
  cuota: 'cuotas',
  reserva: 'reservas',
  entrada: 'entradas',
};

export async function getResumenFinanciero(idSocio) {
  const res = await fetchTo(`/api/v1/finanzas/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener el resumen financiero');
  return res.json();
}

export async function marcarPagadaCaja(tipo, id) {
  const recurso = ENDPOINT_POR_TIPO[tipo];
  const res = await fetchTo(`/api/v1/internos/${recurso}/${encodeURIComponent(id)}/marcar-pagada`, 'POST', {
    pagado_en_caja: true,
  });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al marcar como pagada');
  return res.json();
}
