import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));
import { useAuth } from '../../hooks/useAuth';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el título sin tarjetas protegidas para usuario sin permisos', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, permisos: [] });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /panel principal/i })).toBeInTheDocument();
    expect(screen.queryByText('Socios')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuarios Administrativos')).not.toBeInTheDocument();
  });

  test('muestra la tarjeta de Socios con el permiso ver_socios', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, permisos: ['ver_socios'] });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.queryByText('Usuarios Administrativos')).not.toBeInTheDocument();
  });

  test('muestra ambas tarjetas con ver_socios y ver_usuarios', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, permisos: ['ver_socios', 'ver_usuarios'] });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.getByText('Usuarios Administrativos')).toBeInTheDocument();
  });

  test('navega a /socios al hacer click en la tarjeta de Socios', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, permisos: ['ver_socios'] });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Socios').closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/socios');
  });

  test('navega a /usuarios al hacer click en la tarjeta de Usuarios Administrativos', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, permisos: ['ver_socios', 'ver_usuarios'] });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Usuarios Administrativos').closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/usuarios');
  });
});
