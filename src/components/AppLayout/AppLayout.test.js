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

function renderLayout(permisos = []) {
  useAuth.mockReturnValue({ user: { uid: '1', email: 'admin@club.com' }, loading: false, permisos });
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

  test('el logo de texto es un botón visible en el header', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /ir al dashboard/i })).toBeInTheDocument();
  });

  test('hacer click en el logo de texto navega a /dashboard', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: /ir al dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('el sidebar arranca cerrado al iniciar sesión', () => {
    renderLayout();
    expect(document.querySelector('.app-sidebar')).toHaveClass('hidden');
  });

  test('hacer click en el contenido principal cierra el sidebar si está abierto', () => {
    renderLayout();
    const sidebar = document.querySelector('.app-sidebar');

    fireEvent.click(screen.getByRole('button', { name: /alternar menú lateral/i }));
    expect(sidebar).not.toHaveClass('hidden');

    fireEvent.click(screen.getByRole('main'));
    expect(sidebar).toHaveClass('hidden');
  });

  test('hacer click en el contenido principal no abre el sidebar si está cerrado', () => {
    renderLayout();
    const sidebar = document.querySelector('.app-sidebar');
    expect(sidebar).toHaveClass('hidden');

    fireEvent.click(screen.getByRole('main'));
    expect(sidebar).toHaveClass('hidden');
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

  test('hacer click en el backdrop cierra el sidebar', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: /alternar menú lateral/i }));
    const backdrop = document.querySelector('.app-sidebar-backdrop');
    fireEvent.click(backdrop);
    expect(document.querySelector('.app-sidebar')).toHaveClass('hidden');
  });

  test('hacer click en un nav link cierra el sidebar', () => {
    renderLayout(['ver_socios']);
    fireEvent.click(screen.getByRole('button', { name: /alternar menú lateral/i }));
    expect(document.querySelector('.app-sidebar')).not.toHaveClass('hidden');
    fireEvent.click(screen.getByRole('link', { name: /socios/i }));
    expect(document.querySelector('.app-sidebar')).toHaveClass('hidden');
  });
});
