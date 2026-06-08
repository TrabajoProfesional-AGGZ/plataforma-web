import { login, logout } from './authService';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

jest.mock('../firebase', () => ({ auth: {} }));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

const mockGetIdTokenResult = jest.fn();

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login exitoso con rol válido resuelve sin error', async () => {
    mockGetIdTokenResult.mockResolvedValueOnce({ claims: { role: 'dirigencia' } });
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
