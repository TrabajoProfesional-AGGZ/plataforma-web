import { fetchEstadosSocio, fetchCategoriasSocio } from './catalogosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('catalogosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchEstadosSocio', () => {
    test('llama al endpoint correcto y devuelve los estados', async () => {
      const estados = [{ id: 1, nombre: 'Activo' }, { id: 2, nombre: 'Moroso' }];
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => estados,
      });

      const result = await fetchEstadosSocio();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/estados-socio', 'GET');
      expect(result).toEqual(estados);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchEstadosSocio()).rejects.toThrow('Error al obtener estados');
    });
  });

  describe('fetchCategoriasSocio', () => {
    test('llama al endpoint correcto y devuelve las categorías', async () => {
      const categorias = [{ id: 1, nombre: 'Junior' }, { id: 2, nombre: 'Senior' }];
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => categorias,
      });

      const result = await fetchCategoriasSocio();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/categorias-socio', 'GET');
      expect(result).toEqual(categorias);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchCategoriasSocio()).rejects.toThrow('Error al obtener categorías');
    });
  });
});
