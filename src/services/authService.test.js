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

const mockGetIdTokenResult = jest.fn();

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('login exitoso con rol válido resuelve sin error', async () => {
      mockGetIdTokenResult.mockResolvedValueOnce({ claims: { role: 'admin' } });
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { getIdTokenResult: mockGetIdTokenResult },
      });

      await expect(login('admin@club.com', 'password123')).resolves.toBeDefined();
      expect(signOut).not.toHaveBeenCalled();
    });

    test('login con rol inválido rechaza y llama a signOut', async () => {
      mockGetIdTokenResult.mockResolvedValueOnce({ claims: { role: 'socio' } });
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { getIdTokenResult: mockGetIdTokenResult },
      });
      signOut.mockResolvedValueOnce();

      await expect(login('socio@club.com', 'password123')).rejects.toThrow('unauthorized');
      expect(signOut).toHaveBeenCalledTimes(1);
    });

    test('login con credenciales incorrectas rechaza con error de Firebase', async () => {
      signInWithEmailAndPassword.mockRejectedValueOnce(
        new Error('auth/wrong-password')
      );

      await expect(login('wrong@club.com', 'bad')).rejects.toThrow('auth/wrong-password');
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
