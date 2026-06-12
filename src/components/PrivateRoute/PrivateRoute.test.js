import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../hooks/useAuth');
import { useAuth } from '../../hooks/useAuth';

function renderWithRoute(initialEntry, requiredPermiso) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>Login</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={<PrivateRoute requiredPermiso={requiredPermiso} />}>
          <Route path="/protegida" element={<div>Contenido protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirige a login cuando no hay usuario autenticado', () => {
    useAuth.mockReturnValue({ user: null, loading: false, permisos: [] });
    renderWithRoute('/protegida');
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('redirige a dashboard cuando el usuario no tiene el permiso requerido', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, permisos: [] });
    renderWithRoute('/protegida', 'ver_usuarios');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('muestra el contenido cuando el usuario tiene el permiso requerido', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, permisos: ['ver_usuarios'] });
    renderWithRoute('/protegida', 'ver_usuarios');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  test('muestra el contenido cuando no hay permiso requerido y el usuario está autenticado', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, permisos: [] });
    renderWithRoute('/protegida');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
