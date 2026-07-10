import { fetchTo } from '../utils/utils';

export async function getDisciplinas() {
  const res = await fetchTo('/api/v1/disciplinas', 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener disciplinas');
  const data = await res.json();
  return data.disciplinas ?? data;
}

export async function createDisciplina(data) {
  const res = await fetchTo('/api/v1/disciplinas', 'POST', data);
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al crear disciplina');
  return res.json();
}

export async function pausarDisciplina(id) {
  const res = await fetchTo(`/api/v1/disciplinas/${id}`, 'DELETE');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al pausar disciplina');
}

export async function getSociosByDisciplina(idDisciplina) {
  const res = await fetchTo(`/api/v1/socios/por-disciplina/${idDisciplina}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener socios de la disciplina');
  const data = await res.json();
  return data.socios ?? data;
}

export async function getDisciplinasBySocio(idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/por-socio/${idSocio}`, 'GET');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al obtener disciplinas del socio');
  const data = await res.json();
  return data.disciplinas ?? data;
}

export async function inscribirSocioADisciplina(idDisciplina, idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/${idDisciplina}/socios/${idSocio}`, 'POST');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (res.status === 409) throw new Error('ya-inscripto');
  if (!res.ok) throw new Error('Error al inscribir al socio en la disciplina');
  return res.json();
}

export async function extenderSuscripcionDisciplina(idDisciplina, idSocio) {
  const res = await fetchTo(`/api/v1/disciplinas/${idDisciplina}/socios/${idSocio}/extender`, 'PATCH');
  if (res.status >= 500) throw new Error('servicio-no-disponible');
  if (!res.ok) throw new Error('Error al extender la suscripción');
  return res.json();
}
