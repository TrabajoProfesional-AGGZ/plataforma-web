import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService');
jest.mock('../../hooks/useAuth');
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

const defaultLocation = { pathname: '/dashboard', search: '', hash: '', state: null, key: 'default' };

function renderLayout(permisos = []) {
  useAuth.mockReturnValue({ user: { uid: '1', email: 'admin@club.com' }, loading: false, permisos });
  useLocation.mockReturnValue(defaultLocation);
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

  test('muestra el email del usuario como botón en el header', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: 'admin@club.com' })).toBeInTheDocument();
  });

  test('muestra "Ver perfil" en el dropdown al hacer clic en el email', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'admin@club.com' }));
    expect(screen.getByRole('button', { name: /ver perfil/i })).toBeInTheDocument();
  });

  test('navega a /perfil al hacer clic en "Ver perfil"', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'admin@club.com' }));
    fireEvent.click(screen.getByRole('button', { name: /ver perfil/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  test('muestra el link de dashboard sin permisos', () => {
    renderLayout([]);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  test('no muestra el link de socios sin el permiso ver_socios', () => {
    renderLayout([]);
    expect(screen.queryByRole('link', { name: /socios/i })).not.toBeInTheDocument();
  });

  test('muestra el link de socios con el permiso ver_socios', () => {
    renderLayout(['ver_socios']);
    expect(screen.getByRole('link', { name: /socios/i })).toBeInTheDocument();
  });

  test('no muestra el link de usuarios sin el permiso ver_usuarios', () => {
    renderLayout([]);
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });

  test('muestra el link de usuarios con el permiso ver_usuarios', () => {
    renderLayout(['ver_usuarios']);
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
  });

  test('no muestra el link de cambiar contraseña en la sidebar', () => {
    renderLayout();
    expect(screen.queryByRole('link', { name: /cambiar contraseña/i })).not.toBeInTheDocument();
  });

  test('llama a logout y redirige al login al hacer clic en cerrar sesión', async () => {
    authService.logout.mockResolvedValueOnce();
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('hacer click fuera del dropdown lo cierra', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'admin@club.com' }));
    expect(screen.getByRole('button', { name: /ver perfil/i })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: /ver perfil/i })).not.toBeInTheDocument();
  });

  test('muestra animación de carga al cambiar de ruta', () => {
    useAuth.mockReturnValue({ user: { uid: '1', email: 'admin@club.com' }, loading: false, permisos: [] });
    useLocation.mockReturnValue(defaultLocation);
    const { rerender } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    act(() => {
      useLocation.mockReturnValue({ pathname: '/socios', search: '', hash: '', state: null, key: 'socios' });
      rerender(
        <MemoryRouter>
          <AppLayout />
        </MemoryRouter>
      );
    });

    expect(document.querySelector('.app-page-loading')).toBeInTheDocument();
  });
});
