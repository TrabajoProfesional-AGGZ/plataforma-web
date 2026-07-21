import {
  getDisciplinas,
  createDisciplina,
  pausarDisciplina,
  getSociosByDisciplina,
  getDisciplinasBySocio,
  inscribirSocioADisciplina,
  extenderSuscripcionDisciplina,
  resolverListaEspera,
} from './disciplinasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('disciplinasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDisciplinas', () => {
    test('llama al endpoint correcto y devuelve el array de disciplinas', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ disciplinas: [{ id: '1', nombre: 'Natación' }] }),
      });

      const result = await getDisciplinas();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve la respuesta directa si no tiene clave disciplinas', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: '1' }],
      });

      const result = await getDisciplinas();
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getDisciplinas()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getDisciplinas()).rejects.toThrow('Error al obtener disciplinas');
    });
  });

  describe('createDisciplina', () => {
    const datos = { nombre: 'Natación', cupo_maximo: 30, arancelada: true, concepto_cobro: 'Cuota mensual' };

    test('hace POST al endpoint correcto con los datos de la disciplina', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'uuid-new', ...datos }),
      });

      await createDisciplina(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas', 'POST', datos);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createDisciplina(datos)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico en 400', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createDisciplina(datos)).rejects.toThrow('Error al crear disciplina');
    });
  });

  describe('pausarDisciplina', () => {
    test('hace DELETE al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await pausarDisciplina('uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/uuid-1', 'DELETE');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(pausarDisciplina('uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(pausarDisciplina('uuid-1')).rejects.toThrow('Error al pausar disciplina');
    });
  });

  describe('getSociosByDisciplina', () => {
    test('llama al endpoint correcto con el ID de la disciplina', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 's-1', nro_socio: '1001' }],
      });

      const result = await getSociosByDisciplina('disc-uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/por-disciplina/disc-uuid-1', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve array desde clave socios si está presente', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ socios: [{ id: 's-2' }, { id: 's-3' }] }),
      });

      const result = await getSociosByDisciplina('disc-uuid-2');
      expect(result).toHaveLength(2);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getSociosByDisciplina('disc-uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getSociosByDisciplina('disc-uuid-1')).rejects.toThrow('Error al obtener socios de la disciplina');
    });
  });

  describe('getDisciplinasBySocio', () => {
    test('llama al endpoint correcto con el ID del socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } }],
      });

      const result = await getDisciplinasBySocio('socio-uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/por-socio/socio-uuid-1', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve array desde clave disciplinas si está presente', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ disciplinas: [{ id: 'd-2' }, { id: 'd-3' }] }),
      });

      const result = await getDisciplinasBySocio('socio-uuid-2');
      expect(result).toHaveLength(2);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getDisciplinasBySocio('socio-uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getDisciplinasBySocio('socio-uuid-1')).rejects.toThrow('Error al obtener disciplinas del socio');
    });
  });

  describe('inscribirSocioADisciplina', () => {
    test('hace POST al endpoint correcto con los IDs de disciplina y socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id_disciplina: 'disc-uuid-1', id_socio: 'socio-uuid-1' }),
      });

      await inscribirSocioADisciplina('disc-uuid-1', 'socio-uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/disc-uuid-1/socios/socio-uuid-1', 'POST');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(inscribirSocioADisciplina('disc-uuid-1', 'socio-uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza ya-inscripto en 409', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 409 });
      await expect(inscribirSocioADisciplina('disc-uuid-1', 'socio-uuid-1')).rejects.toThrow('ya-inscripto');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(inscribirSocioADisciplina('disc-uuid-1', 'socio-uuid-1')).rejects.toThrow('Error al inscribir al socio en la disciplina');
    });
  });

  describe('extenderSuscripcionDisciplina', () => {
    test('hace PATCH al endpoint correcto con los IDs de disciplina y socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id_disciplina: 'disc-uuid-1', id_socio: 'socio-uuid-1' }),
      });

      await extenderSuscripcionDisciplina('disc-uuid-1', 'socio-uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/disciplinas/disc-uuid-1/socios/socio-uuid-1/extender', 'PATCH');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(extenderSuscripcionDisciplina('disc-uuid-1', 'socio-uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(extenderSuscripcionDisciplina('disc-uuid-1', 'socio-uuid-1')).rejects.toThrow('Error al extender la suscripción');
    });
  });

  describe('resolverListaEspera', () => {
    test('hace PATCH al endpoint correcto con la acción elegida', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ estado_suscripcion: 'activa' }),
      });

      await resolverListaEspera('disc-uuid-1', 'socio-uuid-1', 'activar');

      expect(fetchTo).toHaveBeenCalledWith(
        '/api/v1/disciplinas/disc-uuid-1/socios/socio-uuid-1/lista-espera',
        'PATCH',
        { accion: 'activar' }
      );
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(resolverListaEspera('disc-uuid-1', 'socio-uuid-1', 'eliminar')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza no-en-espera en 404', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(resolverListaEspera('disc-uuid-1', 'socio-uuid-1', 'activar')).rejects.toThrow('no-en-espera');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(resolverListaEspera('disc-uuid-1', 'socio-uuid-1', 'activar')).rejects.toThrow('Error al resolver la lista de espera');
    });
  });
});
