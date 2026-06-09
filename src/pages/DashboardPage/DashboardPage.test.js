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

  test('renderiza el título y la tarjeta de Socios para admin', () => {
    useAuth.mockReturnValue({ role: 'admin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: /panel principal/i })).toBeInTheDocument();
    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
  });

  test('renderiza la tarjeta de Usuarios para superAdmin', () => {
    useAuth.mockReturnValue({ role: 'superAdmin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });

  test('navega a /socios al hacer click en la tarjeta de Socios', () => {
    useAuth.mockReturnValue({ role: 'admin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Socios').closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/socios');
  });

  test('navega a /usuarios al hacer click en la tarjeta de Usuarios', () => {
    useAuth.mockReturnValue({ role: 'superAdmin' });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Usuarios').closest('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/usuarios');
  });
});
