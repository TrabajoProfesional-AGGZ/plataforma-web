import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../hooks/useAuth');
import { useAuth } from '../../hooks/useAuth';

function renderWithRoute(initialEntry, requiredRole) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>Login</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={<PrivateRoute requiredRole={requiredRole} />}>
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
    useAuth.mockReturnValue({ user: null, loading: false, role: null });
    renderWithRoute('/protegida');
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('redirige a dashboard cuando el rol no coincide con el requerido', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, role: 'admin' });
    renderWithRoute('/protegida', 'superAdmin');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('muestra el contenido cuando el usuario tiene el rol requerido', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, role: 'superAdmin' });
    renderWithRoute('/protegida', 'superAdmin');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  test('muestra el contenido cuando no hay rol requerido y el usuario está autenticado', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, role: 'admin' });
    renderWithRoute('/protegida');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
