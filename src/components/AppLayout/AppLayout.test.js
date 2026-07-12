import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService');
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useTheme');
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

const defaultLocation = { pathname: '/dashboard', search: '', hash: '', state: null, key: 'default' };
const mockToggleTheme = jest.fn();

function renderLayout(permisos = [], theme = 'light') {
  useAuth.mockReturnValue({ user: { uid: '1', email: 'admin@club.com' }, loading: false, permisos });
  useTheme.mockReturnValue({
    theme,
    toggleTheme: mockToggleTheme,
    logoSocio: 'logo-socio.png',
    logoTexto: 'logo-texto.png',
  });
  useLocation.mockReturnValue(defaultLocation);
  return render(
    <MemoryRouter initialEntries={[defaultLocation.pathname]}>
      <AppLayout />
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el email del usuario como texto en el header', () => {
    renderLayout();
    expect(screen.getByText('admin@club.com')).toBeInTheDocument();
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

  test('el botón hamburguesa abre el drawer del sidebar', () => {
    const { container } = renderLayout();

    expect(container.querySelector('.app-sidebar')).not.toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }));

    expect(container.querySelector('.app-sidebar')).toHaveClass('open');
  });

  test('el backdrop cierra el drawer al hacer click', () => {
    const { container } = renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(container.querySelector('.app-sidebar')).toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: /cerrar menú/i }));

    expect(container.querySelector('.app-sidebar')).not.toHaveClass('open');
    expect(container.querySelector('.app-sidebar-backdrop')).not.toBeInTheDocument();
  });

  test('la tecla Escape cierra el drawer', () => {
    const { container } = renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(container.querySelector('.app-sidebar')).toHaveClass('open');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(container.querySelector('.app-sidebar')).not.toHaveClass('open');
  });

  test('el drawer se cierra al hacer click en un link de navegación', () => {
    const { container } = renderLayout(['ver_socios']);

    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(container.querySelector('.app-sidebar')).toHaveClass('open');

    fireEvent.click(screen.getByRole('link', { name: /socios/i }));

    expect(container.querySelector('.app-sidebar')).not.toHaveClass('open');
  });

  test('el indicador de sección activa se reposiciona al redimensionar/hacer zoom', () => {
    const { container } = renderLayout();

    const indicator = container.querySelector('.sidebar-active-bg');
    indicator.style.opacity = '0';
    indicator.style.transition = 'transform 1s ease-out';

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(indicator.style.opacity).toBe('1');
    expect(indicator.style.transition).toBe('none');
  });

  test('el drawer se cierra automáticamente al cambiar de ruta', () => {
    const { container, rerender } = renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(container.querySelector('.app-sidebar')).toHaveClass('open');

    useLocation.mockReturnValue({ ...defaultLocation, pathname: '/perfil' });
    rerender(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(container.querySelector('.app-sidebar')).not.toHaveClass('open');
  });

  test('en modo claro muestra el botón para activar modo oscuro', () => {
    renderLayout([], 'light');
    expect(screen.getByRole('button', { name: /activar modo oscuro/i })).toBeInTheDocument();
  });

  test('en modo oscuro muestra el botón para activar modo claro', () => {
    renderLayout([], 'dark');
    expect(screen.getByRole('button', { name: /activar modo claro/i })).toBeInTheDocument();
  });

  test('el botón de tema llama a toggleTheme al hacer click', () => {
    renderLayout([], 'light');
    fireEvent.click(screen.getByRole('button', { name: /activar modo oscuro/i }));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});

  test('no muestra el link de métricas sin el permiso ver_metricas', () => {
    renderLayout([]);
    expect(screen.queryByRole('link', { name: /métricas/i })).not.toBeInTheDocument();
  });

  test('muestra el link de métricas con el permiso ver_metricas', () => {
    renderLayout(['ver_metricas']);
    expect(screen.getByRole('link', { name: /métricas/i })).toBeInTheDocument();
  });