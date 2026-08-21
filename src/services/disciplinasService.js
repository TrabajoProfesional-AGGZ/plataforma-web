import { fetchTo } from '../utils/utils';

/** Obtiene el listado completo de disciplinas. */
export async function getDisciplinas() {
  const res = await fetchTo('/api/v1/disciplinas', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener disciplinas');
  const data = await res.json();
  return data.disciplinas ?? data;
}

/** Crea una disciplina nueva. */
export async function createDisciplina(data) {
  const res = await fetchTo('/api/v1/disciplinas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear disciplina');
  return res.json();
}

/** Pausa una disciplina por id. */
export async function pausarDisciplina(id) {
  const res = await fetchTo(`/api/v1/disciplinas/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al pausar disciplina');
}

/** Obtiene los socios inscriptos en una disciplina, con su estado de suscripción. */
export async function getSociosByDisciplina(idDisciplina) {
  const res = await fetchTo(`/api/v1/socios/por-disciplina/${encodeURIComponent(idDisciplina)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener socios de la disciplina');
  const data = await res.json();
  return data.socios ?? data;
}

/** Obtiene las disciplinas en las que está inscripto un socio. */
export async function getDisciplinasBySocio(idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/por-socio/${encodeURIComponent(idSocio)}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener disciplinas del socio');
  const data = await res.json();
  return data.disciplinas ?? data;
}

/** Inscribe a un socio en una disciplina. */
export async function inscribirSocioADisciplina(idDisciplina, idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/${encodeURIComponent(idDisciplina)}/socios/${encodeURIComponent(idSocio)}`, 'POST');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('ya-inscripto');
  if (!res.ok) throw new Error('Error al inscribir al socio en la disciplina');
  return res.json();
}

/** Extiende la suscripción de un socio en una disciplina. */
export async function extenderSuscripcionDisciplina(idDisciplina, idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/${encodeURIComponent(idDisciplina)}/socios/${encodeURIComponent(idSocio)}/extender`, 'PATCH');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al extender la suscripción');
  return res.json();
}

/** Resuelve a un socio en lista de espera de una disciplina (`accion`: 'activar' | 'eliminar'). */
export async function resolverListaEspera(idDisciplina, idSocio, accion) {
  const res = await fetchTo(`/api/v1/disciplinas/${encodeURIComponent(idDisciplina)}/socios/${encodeURIComponent(idSocio)}/lista-espera`, 'PATCH', { accion });
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 404) throw new Error('no-en-espera');
  if (!res.ok) throw new Error('Error al resolver la lista de espera');
  return res.json();
}
