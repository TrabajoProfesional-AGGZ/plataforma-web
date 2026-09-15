import { fetchTo } from '../utils/utils';

/** Crea una entrada para un socio en un evento. */
export async function createEntrada({ id_evento, id_socio }) {
  const res = await fetchTo('/api/v1/entradas', 'POST', { id_evento, id_socio });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail ?? {};
    const error = new Error(detail.tipo === 'suspendido' ? 'socio-suspendido' : 'socio-moroso');
    error.socio = detail.socio ?? null;
    throw error;
  }
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const tipo = body?.detail?.tipo;
    throw new Error(tipo || 'conflicto');
  }
  if (!res.ok) throw new Error('Error al crear entrada');
  return res.json();
}
