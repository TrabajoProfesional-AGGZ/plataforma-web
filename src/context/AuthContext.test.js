import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './AuthContext';

jest.mock('../firebase', () => ({ auth: {} }));

const mockOnAuthStateChanged = jest.fn();
const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signOut: (...args) => mockSignOut(...args),
}));

global.fetch = jest.fn();

function TestConsumer() {
  const { user, loading, role, permisos, userData } = useAuthContext();
  if (loading) return <div>Cargando...</div>;
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'sin-usuario'}</span>
      <span data-testid="role">{role ?? 'sin-rol'}</span>
      <span data-testid="permisos">{permisos.join(',')}</span>
      <span data-testid="userData">{userData ? userData.nombre : 'sin-data'}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra loading mientras onAuthStateChanged no dispara', () => {
    mockOnAuthStateChanged.mockImplementation(() => () => {});
    renderProvider();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  test('cuando no hay usuario, limpia el estado y sale del loading', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('sin-usuario');
      expect(screen.getByTestId('permisos')).toHaveTextContent('');
    });
  });

  test('cuando hay usuario válido, carga rol y permisos desde el backend', async () => {
    const mockUser = {
      email: 'admin@club.com',
      getIdToken: async () => 'id-token',
    };

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rol: 'SuperAdmin',
        permisos: ['ver_socios', 'ver_usuarios'],
        usuario_id: 'uuid-1',
        nombre: 'Carlos',
        apellido: 'Ruiz',
        email: 'admin@club.com',
      }),
    });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('role')).toHaveTextContent('SuperAdmin');
      expect(screen.getByTestId('permisos')).toHaveTextContent('ver_socios,ver_usuarios');
      expect(screen.getByTestId('userData')).toHaveTextContent('Carlos');
    });
  });

  test('cuando el backend rechaza, hace signOut', async () => {
    const mockUser = {
      email: 'admin@club.com',
      getIdToken: async () => 'id-token',
    };

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    mockSignOut.mockResolvedValueOnce();

    renderProvider();

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
