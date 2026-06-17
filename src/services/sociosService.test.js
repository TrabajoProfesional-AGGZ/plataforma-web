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
    const SOCIOS = [
      { id: 'uuid-100', nro_socio: 100, nombre: 'Ana', apellido: 'López' },
      { id: 'uuid-200', nro_socio: 200, nombre: 'Pedro', apellido: 'Gómez' },
    ];

    function mockGetSocios(socios) {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ socios }),
      });
    }

    test('devuelve el socio cuando el nro_socio coincide', async () => {
      mockGetSocios(SOCIOS);
      const result = await getSocioByNroSocio(100);
      expect(result).toEqual(SOCIOS[0]);
    });

    test('funciona cuando nro_socio se pasa como string', async () => {
      mockGetSocios(SOCIOS);
      const result = await getSocioByNroSocio('200');
      expect(result).toEqual(SOCIOS[1]);
    });

    test('lanza socio-no-encontrado si ningún socio coincide', async () => {
      mockGetSocios(SOCIOS);
      await expect(getSocioByNroSocio(9999)).rejects.toThrow('socio-no-encontrado');
    });

    test('propaga el error si getSocios falla con 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getSocioByNroSocio(100)).rejects.toThrow('servicio-no-disponible');
    });
  });
});
