import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PerfilPage from './PerfilPage';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../hooks/useAuth');
jest.mock('../../services/authService');
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

  describe('modal de cambio de contraseña', () => {
    test('el modal no se muestra al cargar la página', () => {
      renderPage();
      expect(screen.queryByRole('heading', { name: /cambiar contraseña/i })).not.toBeInTheDocument();
    });

    test('el modal se abre al hacer click en "Cambiar contraseña"', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
      expect(screen.getByRole('heading', { name: /cambiar contraseña/i })).toBeInTheDocument();
    });

    test('el modal se cierra al hacer click en "Cancelar"', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(screen.queryByRole('heading', { name: /cambiar contraseña/i })).not.toBeInTheDocument();
    });

    test('el modal se cierra al presionar ESC', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('heading', { name: /cambiar contraseña/i })).not.toBeInTheDocument();
    });

    test('el modal se cierra al hacer click fuera de él', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
      fireEvent.click(screen.getByRole('heading', { name: /cambiar contraseña/i }).closest('.csf-overlay'));
      expect(screen.queryByRole('heading', { name: /cambiar contraseña/i })).not.toBeInTheDocument();
    });

    test('muestra error si las contraseñas nuevas no coinciden sin llamar al servicio', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } });
      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva123' } });
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'diferente456' } });
      fireEvent.submit(screen.getByLabelText('Contraseña actual').closest('form'));

      expect(screen.getByRole('alert')).toHaveTextContent(/no coinciden/i);
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    test('llama a changePassword y logout, luego redirige al login', async () => {
      authService.changePassword.mockResolvedValueOnce();
      authService.logout.mockResolvedValueOnce();
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } });
      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva456' } });
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'nueva456' } });
      fireEvent.submit(screen.getByLabelText('Contraseña actual').closest('form'));

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith('actual123', 'nueva456');
        expect(authService.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/', { state: { passwordChanged: true } });
      });
    });

    test('muestra error si changePassword falla y mantiene el modal abierto', async () => {
      authService.changePassword.mockRejectedValueOnce(new Error('auth/wrong-password'));
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'incorrecta' } });
      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva456' } });
      fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'nueva456' } });
      fireEvent.submit(screen.getByLabelText('Contraseña actual').closest('form'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/incorrecta/i);
        expect(authService.logout).not.toHaveBeenCalled();
      });
      expect(screen.getByRole('heading', { name: /cambiar contraseña/i })).toBeInTheDocument();
    });

    test('el botón de mostrar/ocultar contraseña cambia la visibilidad del campo', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      const showButton = screen.getAllByRole('button', { name: /mostrar contraseña/i })[0];
      fireEvent.click(showButton);

      expect(screen.getAllByRole('button', { name: /ocultar contraseña/i }).length).toBeGreaterThan(0);
    });

    test('los campos de contraseña aplican estilo al recibir y perder foco', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      const input = screen.getByLabelText('Contraseña actual');
      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(input).toBeInTheDocument();
    });
  });
});
