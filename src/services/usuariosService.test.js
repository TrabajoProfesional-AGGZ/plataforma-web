import { getUsers, updateUserRole, createUser } from './usuariosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('usuariosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    test('llama al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ uid: '1', email: 'a@b.com', role: 'admin' }],
      });

      const result = await getUsers();

      expect(fetchTo).toHaveBeenCalledWith('/admin/users', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false });
      await expect(getUsers()).rejects.toThrow('Error al obtener usuarios');
    });
  });

  describe('updateUserRole', () => {
    test('hace PATCH al endpoint correcto con el nuevo rol', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true });

      await updateUserRole('uid123', 'superAdmin');

      expect(fetchTo).toHaveBeenCalledWith(
        '/admin/users/uid123/role',
        'PATCH',
        { role: 'superAdmin' }
      );
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false });
      await expect(updateUserRole('uid123', 'admin')).rejects.toThrow(
        'Error al actualizar rol'
      );
    });
  });

  describe('createUser', () => {
    test('hace POST al endpoint correcto con email, password y rol', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uid: 'nuevo-uid' }),
      });

      await createUser('nuevo@club.com', 'pass123', 'admin');

      expect(fetchTo).toHaveBeenCalledWith(
        '/admin/users',
        'POST',
        { email: 'nuevo@club.com', password: 'pass123', role: 'admin' }
      );
    });

    test('retorna los datos del usuario creado', async () => {
      const nuevoUsuario = { uid: 'nuevo-uid', email: 'nuevo@club.com', role: 'admin' };
      fetchTo.mockResolvedValueOnce({ ok: true, json: async () => nuevoUsuario });

      const result = await createUser('nuevo@club.com', 'pass123', 'admin');

      expect(result).toEqual(nuevoUsuario);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false });
      await expect(createUser('x@x.com', 'pass', 'admin')).rejects.toThrow(
        'Error al crear usuario'
      );
    });
  });
});
