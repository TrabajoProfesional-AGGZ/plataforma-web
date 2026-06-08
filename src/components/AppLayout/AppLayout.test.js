import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService');
jest.mock('../../hooks/useAuth');
import { useAuth } from '../../hooks/useAuth';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderLayout(role = 'admin') {
  useAuth.mockReturnValue({ user: { uid: '1', email: 'admin@club.com' }, loading: false, role });
  return render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra los links de navegación para todos los roles', () => {
    renderLayout('admin');
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /socios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cambiar contraseña/i })).toBeInTheDocument();
  });

  test('no muestra el link de usuarios para rol admin', () => {
    renderLayout('admin');
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });

  test('muestra el link de usuarios para rol superAdmin', () => {
    renderLayout('superAdmin');
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
  });

  test('muestra el email y rol del usuario en el header', () => {
    renderLayout('admin');
    expect(screen.getByText(/admin@club\.com/)).toBeInTheDocument();
    expect(screen.getByText(/admin/)).toBeInTheDocument();
  });

  test('llama a logout y redirige al login al hacer clic en cerrar sesión', async () => {
    authService.logout.mockResolvedValueOnce();
    renderLayout('admin');

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
