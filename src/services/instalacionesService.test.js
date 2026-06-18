import { getInstalaciones, createInstalacion, deleteInstalacion } from './instalacionesService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('instalacionesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstalaciones', () => {
    test('llama al endpoint correcto y devuelve el array de instalaciones', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ instalaciones: [{ id: '1', nombre: 'Cancha' }] }),
      });

      const result = await getInstalaciones();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/instalaciones', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve la respuesta directa si no tiene clave instalaciones', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: '1' }],
      });

      const result = await getInstalaciones();
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getInstalaciones()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getInstalaciones()).rejects.toThrow('Error al obtener instalaciones');
    });
  });

  describe('createInstalacion', () => {
    const datos = { nombre: 'Cancha', tipo: 'Deportiva', capacidad_maxima: 50, valor_hora: 1500, activa: true };

    test('hace POST al endpoint correcto con los datos de la instalación', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'uuid-new', ...datos }),
      });

      await createInstalacion(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/instalaciones', 'POST', datos);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createInstalacion(datos)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico en 400', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createInstalacion(datos)).rejects.toThrow('Error al crear instalación');
    });
  });

  describe('deleteInstalacion', () => {
    test('hace DELETE al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await deleteInstalacion('uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/instalaciones/uuid-1', 'DELETE');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(deleteInstalacion('uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(deleteInstalacion('uuid-1')).rejects.toThrow('Error al eliminar instalación');
    });
  });
});
