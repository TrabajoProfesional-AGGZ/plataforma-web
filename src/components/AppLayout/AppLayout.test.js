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

  test('muestra el email del usuario como botón en el header', () => {
    renderLayout('admin');
    expect(screen.getByRole('button', { name: 'admin@club.com' })).toBeInTheDocument();
  });

  test('muestra "Ver perfil" en el dropdown al hacer clic en el email', () => {
    renderLayout('admin');
    fireEvent.click(screen.getByRole('button', { name: 'admin@club.com' }));
    expect(screen.getByRole('button', { name: /ver perfil/i })).toBeInTheDocument();
  });

  test('navega a /perfil al hacer clic en "Ver perfil"', () => {
    renderLayout('admin');
    fireEvent.click(screen.getByRole('button', { name: 'admin@club.com' }));
    fireEvent.click(screen.getByRole('button', { name: /ver perfil/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  test('muestra los links de navegación para todos los roles', () => {
    renderLayout('admin');
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /socios/i })).toBeInTheDocument();
  });

  test('no muestra el link de usuarios para rol admin', () => {
    renderLayout('admin');
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });

  test('muestra el link de usuarios para rol superAdmin', () => {
    renderLayout('superAdmin');
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
  });

  test('no muestra el link de cambiar contraseña en la sidebar', () => {
    renderLayout('admin');
    expect(screen.queryByRole('link', { name: /cambiar contraseña/i })).not.toBeInTheDocument();
  });

  test('hacer click en el contenido principal cierra el sidebar si está abierto', () => {
    renderLayout('admin');
    const sidebar = document.querySelector('.app-sidebar');
    expect(sidebar).not.toHaveClass('hidden');

    fireEvent.click(screen.getByRole('main'));
    expect(sidebar).toHaveClass('hidden');
  });

  test('hacer click en el contenido principal no abre el sidebar si está cerrado', () => {
    renderLayout('admin');
    const sidebar = document.querySelector('.app-sidebar');

    fireEvent.click(screen.getByRole('button', { name: /alternar menú lateral/i }));
    expect(sidebar).toHaveClass('hidden');

    fireEvent.click(screen.getByRole('main'));
    expect(sidebar).toHaveClass('hidden');
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
