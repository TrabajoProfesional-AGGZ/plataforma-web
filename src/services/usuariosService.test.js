import { getUsers, updateUserRole, createUser } from './usuariosService';

const mockGetIdToken = jest.fn();
jest.mock('../firebase', () => ({
  auth: {
    currentUser: { getIdToken: jest.fn() },
  },
}));
import { auth } from '../firebase';

global.fetch = jest.fn();

describe('usuariosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser.getIdToken.mockResolvedValue('mock-token');
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:8080';
  });

  describe('getUsers', () => {
    test('llama al endpoint correcto con el header de autorización', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ uid: '1', email: 'a@b.com', role: 'admin' }],
      });

      const result = await getUsers();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/admin/users',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        })
      );
      expect(result).toHaveLength(1);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(getUsers()).rejects.toThrow('Error al obtener usuarios');
    });
  });

  describe('updateUserRole', () => {
    test('hace PATCH al endpoint correcto con el nuevo rol', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await updateUserRole('uid123', 'superAdmin');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/admin/users/uid123/role',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ role: 'superAdmin' }),
          headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        })
      );
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(updateUserRole('uid123', 'admin')).rejects.toThrow(
        'Error al actualizar rol'
      );
    });
  });

  describe('createUser', () => {
    test('hace POST al endpoint correcto con email, password y rol', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uid: 'nuevo-uid' }),
      });

      await createUser('nuevo@club.com', 'pass123', 'admin');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/admin/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'nuevo@club.com', password: 'pass123', role: 'admin' }),
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('retorna los datos del usuario creado', async () => {
      const nuevoUsuario = { uid: 'nuevo-uid', email: 'nuevo@club.com', role: 'admin' };
      fetch.mockResolvedValueOnce({ ok: true, json: async () => nuevoUsuario });

      const result = await createUser('nuevo@club.com', 'pass123', 'admin');

      expect(result).toEqual(nuevoUsuario);
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      await expect(createUser('x@x.com', 'pass', 'admin')).rejects.toThrow(
        'Error al crear usuario'
      );
    });
  });
});
