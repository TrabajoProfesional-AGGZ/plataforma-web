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

  test('renderiza el título y las tarjetas visibles para admin', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, role: 'admin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /panel principal/i })).toBeInTheDocument();
    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.queryByText('Usuarios Administrativos')).not.toBeInTheDocument();
  });

  test('renderiza la tarjeta de Usuarios Administrativos para superAdmin', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, role: 'superAdmin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.getByText('Usuarios Administrativos')).toBeInTheDocument();
  });

  test('navega a /socios al hacer click en la tarjeta de Socios', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, role: 'admin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Socios').closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/socios');
  });

  test('navega a /usuarios al hacer click en la tarjeta de Usuarios Administrativos', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, role: 'superAdmin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Usuarios Administrativos').closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/usuarios');
  });
});
