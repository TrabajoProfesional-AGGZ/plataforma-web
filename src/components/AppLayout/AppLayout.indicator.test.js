import { render, screen, act, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService', () => ({ logout: jest.fn().mockResolvedValue() }));
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useTheme');

import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

function buildRouter(initialPath, permisos = []) {
  useAuth.mockReturnValue({
    user: { uid: '1', email: 'admin@test.com' },
    loading: false,
    permisos,
  });
  useTheme.mockReturnValue({
    theme: 'light',
    toggleTheme: jest.fn(),
    logoSocio: 'logo-socio.png',
    logoTexto: 'logo-texto.png',
  });
  return createMemoryRouter(
    [{ path: '*', element: <AppLayout /> }],
    { initialEntries: [initialPath] }
  );
}

describe('AppLayout - animación del indicador de navegación', () => {
  beforeEach(() => jest.clearAllMocks());

  test('en el primer render ubica el indicador sin animar y suelta el snap al siguiente frame', async () => {
    const router = buildRouter('/dashboard');
    const { container } = render(<RouterProvider router={router} />);
    const indicator = container.querySelector('.sidebar-active-bg');

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveClass('active');
    expect(indicator.style.opacity).toBe('1');
    expect(indicator).toHaveClass('sidebar-active-bg--snap');

    await waitFor(() => expect(indicator).not.toHaveClass('sidebar-active-bg--snap'));
  });

  test('al navegar posiciona el indicador sobre el link destino sin volver a snapear', async () => {
    const router = buildRouter('/dashboard', ['ver_socios', 'ver_usuarios']);
    const { container } = render(<RouterProvider router={router} />);
    const indicator = container.querySelector('.sidebar-active-bg');
    await waitFor(() => expect(indicator).not.toHaveClass('sidebar-active-bg--snap'));

    await act(async () => {
      await router.navigate('/usuarios');
    });

    const destino = screen.getByRole('link', { name: /usuarios/i });
    expect(destino).toHaveClass('active');
    expect(indicator.style.transform).toBe(`translateY(${destino.offsetTop}px)`);
    expect(indicator.style.height).toBe(`${destino.offsetHeight}px`);
    expect(indicator).not.toHaveClass('sidebar-active-bg--snap');
    expect(indicator.style.transition).toBe('');
  });

  test('no toca el indicador si ninguna ruta coincide con un link', async () => {
    const router = buildRouter('/dashboard');
    const { container } = render(<RouterProvider router={router} />);
    const indicator = container.querySelector('.sidebar-active-bg');
    await waitFor(() => expect(indicator).not.toHaveClass('sidebar-active-bg--snap'));
    const transformAntes = indicator.style.transform;

    await act(async () => {
      await router.navigate('/ruta-inexistente');
    });

    expect(indicator.style.transform).toBe(transformAntes);
    expect(indicator).not.toHaveClass('sidebar-active-bg--snap');
  });
});
