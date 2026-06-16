import { fetchPermisos } from './permisosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('permisosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPermisos', () => {
    test('llama al endpoint correcto y devuelve los permisos', async () => {
      const permisos = [
        { id: 1, nombre: 'ver_socios' },
        { id: 2, nombre: 'crear_socio' },
      ];
      fetchTo.mockResolvedValueOnce({
        ok: true,
        json: async () => permisos,
      });

      const result = await fetchPermisos();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/permisos', 'GET');
      expect(result).toEqual(permisos);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchPermisos()).rejects.toThrow('Error al obtener permisos');
    });
  });
});
