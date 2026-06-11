import { login, logout, changePassword } from './authService';
import {
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth';

const mockCurrentUser = { email: 'admin@club.com' };
jest.mock('../firebase', () => ({ auth: { currentUser: { email: 'admin@club.com' } } }));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
}));

const mockGetIdToken = jest.fn();

const mockLoginResponse = {
  usuario_id: 'uuid-123',
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'admin@club.com',
  rol: 'ADMIN',
  permisos: ['ver_socios', 'crear_socios'],
};

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('login', () => {
    test('login exitoso devuelve los datos del usuario con permisos', async () => {
      mockGetIdToken.mockResolvedValueOnce('mock-id-token');
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { getIdToken: mockGetIdToken },
      });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      });

      const result = await login('admin@club.com', 'password123');

      expect(result).toEqual(mockLoginResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-id-token',
          }),
          body: JSON.stringify({ id_token: 'mock-id-token' }),
        })
      );
      expect(signOut).not.toHaveBeenCalled();
    });

    test('login con usuario no autorizado en el backend rechaza y llama a signOut', async () => {
      mockGetIdToken.mockResolvedValueOnce('mock-id-token');
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { getIdToken: mockGetIdToken },
      });
      global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
      signOut.mockResolvedValueOnce();

      await expect(login('noauth@club.com', 'password123')).rejects.toThrow('unauthorized');
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    test('login con credenciales incorrectas rechaza con error de Firebase antes de llamar al backend', async () => {
      signInWithEmailAndPassword.mockRejectedValueOnce(
        new Error('auth/wrong-password')
      );

      await expect(login('wrong@club.com', 'bad')).rejects.toThrow('auth/wrong-password');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    test('cambia la contraseña correctamente cuando la contraseña actual es válida', async () => {
      const mockCredential = {};
      EmailAuthProvider.credential.mockReturnValueOnce(mockCredential);
      reauthenticateWithCredential.mockResolvedValueOnce();
      updatePassword.mockResolvedValueOnce();

      await expect(changePassword('actual123', 'nueva456')).resolves.toBeUndefined();
      expect(EmailAuthProvider.credential).toHaveBeenCalledWith('admin@club.com', 'actual123');
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(
        mockCurrentUser,
        mockCredential
      );
      expect(updatePassword).toHaveBeenCalledWith(mockCurrentUser, 'nueva456');
    });

    test('rechaza si la contraseña actual es incorrecta', async () => {
      EmailAuthProvider.credential.mockReturnValueOnce({});
      reauthenticateWithCredential.mockRejectedValueOnce(
        new Error('auth/wrong-password')
      );

      await expect(changePassword('incorrecta', 'nueva456')).rejects.toThrow(
        'auth/wrong-password'
      );
      expect(updatePassword).not.toHaveBeenCalled();
    });
  });
});
