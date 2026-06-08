import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PerfilPage from './PerfilPage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../hooks/useAuth');
import { useAuth } from '../../hooks/useAuth';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderPage(role = 'admin') {
  useAuth.mockReturnValue({ user: { email: 'admin@club.com' }, loading: false, role });
  return render(
    <MemoryRouter>
      <PerfilPage />
    </MemoryRouter>
  );
}

describe('PerfilPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el email y el rol del usuario', () => {
    renderPage('admin');
    expect(screen.getByText('admin@club.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  test('navega a /cambiar-contrasena al hacer clic en el botón', () => {
    renderPage('admin');
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cambiar-contrasena');
  });
});
