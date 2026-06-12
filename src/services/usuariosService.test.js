import {
  fetchUsuarios,
  crearUsuario,
  editarUsuario,
  cambiarRolUsuario,
  eliminarUsuario,
} from './usuariosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('usuariosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUsuarios', () => {
    test('llama al endpoint correcto y retorna data.usuarios', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ usuarios: [{ id: '1', nombre: 'Ana' }], total: 1 }),
      });

      const result = await fetchUsuarios();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/usuarios?pagina=1&limite=100', 'GET');
      expect(result).toHaveLength(1);
    });

    test('retorna data directamente cuando no hay clave usuarios', async () => {
      const lista = [{ id: '1', nombre: 'Ana' }];
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => lista,
      });

      const result = await fetchUsuarios();
      expect(result).toBe(lista);
    });

    test('lanza error de servicio no disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchUsuarios()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(fetchUsuarios()).rejects.toThrow('Error al obtener usuarios');
    });
  });

  describe('crearUsuario', () => {
    test('hace POST a /api/v1/auth/registrar con los datos del usuario', async () => {
      const datos = {
        nombre: 'Ana',
        apellido: 'López',
        email: 'ana@club.com',
        password: 'secreta123',
        rol: 'ADMIN',
      };
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-new', ...datos }),
      });

      await crearUsuario(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/auth/registrar', 'POST', datos);
    });

    test('lanza usuario-duplicado en conflicto 409', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 409 });
      await expect(crearUsuario({})).rejects.toThrow('usuario-duplicado');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(crearUsuario({})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok (ni 409 ni 5xx)', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(crearUsuario({})).rejects.toThrow('Error al crear usuario');
    });
  });

  describe('editarUsuario', () => {
    test('hace PATCH al endpoint correcto con nombre y apellido', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-1', nombre: 'Ana', apellido: 'López' }),
      });

      await editarUsuario('uuid-1', { nombre: 'Ana', apellido: 'López' });

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/usuarios/uuid-1', 'PATCH', {
        nombre: 'Ana',
        apellido: 'López',
      });
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(editarUsuario('uuid-1', {})).rejects.toThrow('Error al modificar usuario');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 503 });
      await expect(editarUsuario('uuid-1', {})).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('cambiarRolUsuario', () => {
    test('hace PATCH al endpoint de auth con el nuevo rol', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'uuid-1' }),
      });

      await cambiarRolUsuario('uuid-1', 'PRESIDENTE');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/auth/usuarios/uuid-1/rol', 'PATCH', {
        rol: 'PRESIDENTE',
      });
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(cambiarRolUsuario('uuid-1', 'ADMIN')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(cambiarRolUsuario('uuid-1', 'ADMIN')).rejects.toThrow('Error al cambiar rol');
    });
  });

  describe('eliminarUsuario', () => {
    test('hace DELETE al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await eliminarUsuario('uuid-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/usuarios/uuid-1', 'DELETE');
    });

    test('lanza error cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(eliminarUsuario('uuid-1')).rejects.toThrow('Error al eliminar usuario');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(eliminarUsuario('uuid-1')).rejects.toThrow('servicio-no-disponible');
    });
  });
});
