import { fetchRoles } from './rolesService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('rolesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRoles', () => {
    test('llama al endpoint correcto y devuelve los roles', async () => {
      const roles = [{ id: 1, nombre: 'SuperAdmin' }, { id: 2, nombre: 'Administrador' }];
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => roles,
      });

      const result = await fetchRoles();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/roles', 'GET');
      expect(result).toEqual(roles);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchRoles()).rejects.toThrow('Error al obtener roles');
    });
  });
});
