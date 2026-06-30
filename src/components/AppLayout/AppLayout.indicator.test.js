import { render, screen, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService', () => ({ logout: jest.fn().mockResolvedValue() }));
jest.mock('../../hooks/useAuth');

import { useAuth } from '../../hooks/useAuth';

function buildRouter(initialPath, permisos = []) {
  useAuth.mockReturnValue({
    user: { uid: '1', email: 'admin@test.com' },
    loading: false,
    permisos,
  });
  return createMemoryRouter(
    [{ path: '*', element: <AppLayout /> }],
    { initialEntries: [initialPath] }
  );
}

describe('AppLayout - animación del indicador de navegación', () => {
  beforeEach(() => jest.clearAllMocks());

  test('inicializa el indicador en el link activo al primer render', () => {
    const router = buildRouter('/dashboard');
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveClass('active');
  });

  test('desliza el indicador al navegar al link adyacente', async () => {
    const router = buildRouter('/dashboard', ['ver_socios']);
    render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate('/socios');
    });

    expect(screen.getByRole('link', { name: /socios/i })).toHaveClass('active');
  });

  test('anima el indicador en múltiples pasos al saltar links no adyacentes', async () => {
    const router = buildRouter('/dashboard', ['ver_socios', 'ver_usuarios']);
    render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate('/usuarios');
      // Esperar que los timeouts de 50ms de doStep completen
      await new Promise(res => setTimeout(res, 200));
    });

    expect(screen.getByRole('link', { name: /usuarios/i })).toHaveClass('active');
  });
});
