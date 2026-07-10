import { getSocios, createSocio, updateSocio, deleteSocio, getSocioByNroSocio } from './sociosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('sociosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSocios', () => {
    test('llama al endpoint correcto y devuelve el array de socios', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ socios: [{ id: '1', nombre: 'Juan' }], total: 1 }),
      });

      const result = await getSocios();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios?pagina=1&limite=100', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve la respuesta directa si no tiene clave socios', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: '1' }],
      });

      const result = await getSocios();
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getSocios()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getSocios()).rejects.toThrow('Error al obtener socios');
    });
  });

  describe('createSocio', () => {
    const datos = { nombre: 'Juan', apellido: 'Pérez', email: 'juan@club.com' };

    test('hace POST al endpoint correcto con los datos del socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'uuid-new', ...datos }),
      });

      await createSocio(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios', 'POST', datos);
    });

    test('lanza socio-duplicado en 409', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 409 });
      await expect(createSocio(datos)).rejects.toThrow('socio-duplicado');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createSocio(datos)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico en 400', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createSocio(datos)).rejects.toThrow('Error al crear socio');
    });
  });

  describe('updateSocio', () => {
    test('hace PATCH al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-1' }),
      });

      await updateSocio('uuid-1', { nombre: 'Juan' });

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/uuid-1', 'PATCH', { nombre: 'Juan' });
    });

    test('encodea caracteres especiales del id', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      await updateSocio('123/../x?a=1', {});

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/123%2F..%2Fx%3Fa%3D1', 'PATCH', {});
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(updateSocio('uuid-1', {})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(updateSocio('uuid-1', {})).rejects.toThrow('Error al modificar socio');
    });
  });

  describe('deleteSocio', () => {
    test('hace DELETE al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await deleteSocio('uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/uuid-1', 'DELETE');
    });

    test('encodea caracteres especiales del id', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await deleteSocio('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/123%2F..%2Fx%3Fa%3D1', 'DELETE');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(deleteSocio('uuid-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(deleteSocio('uuid-1')).rejects.toThrow('Error al eliminar socio');
    });
  });

  describe('getSocioByNroSocio', () => {
    test('llama al endpoint correcto con el nro de socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-1000', nro_socio: 1000, nombre: 'Ana' }),
      });

      await getSocioByNroSocio(1000);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/por-nro-socio/1000', 'GET');
    });

    test('encodea caracteres especiales del nro de socio', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      await getSocioByNroSocio('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/socios/por-nro-socio/123%2F..%2Fx%3Fa%3D1', 'GET');
    });

    test('lanza socio-no-encontrado en 404', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getSocioByNroSocio(9999)).rejects.toThrow('socio-no-encontrado');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getSocioByNroSocio(1000)).rejects.toThrow('servicio-no-disponible');
    });
  });
});
