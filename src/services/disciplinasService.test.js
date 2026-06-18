import { getDisciplinas, createDisciplina, pausarDisciplina } from './disciplinasService';

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
});
