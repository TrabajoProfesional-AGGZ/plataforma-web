import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CambiarContrasenaPage from './CambiarContrasenaPage';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CambiarContrasenaPage />
    </MemoryRouter>
  );
}

describe('CambiarContrasenaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza los tres campos y el botón', () => {
    renderPage();
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cambiar contraseña/i })).toBeInTheDocument();
  });

  test('muestra error si las contraseñas nuevas no coinciden sin llamar al servicio', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva123' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'diferente456' } });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/no coinciden/i);
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  test('llama a changePassword y logout, luego redirige al login', async () => {
    authService.changePassword.mockResolvedValueOnce();
    authService.logout.mockResolvedValueOnce();
    renderPage();

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva456' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'nueva456' } });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith('actual123', 'nueva456');
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/', { state: { passwordChanged: true } });
    });
  });

  test('muestra error si changePassword falla', async () => {
    authService.changePassword.mockRejectedValueOnce(new Error('auth/wrong-password'));
    renderPage();

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'incorrecta' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva456' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'nueva456' } });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrecta/i);
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  test('el botón "Mostrar" alterna la visibilidad de la contraseña', () => {
    renderPage();
    const toggleButtons = screen.getAllByRole('button', { name: /mostrar contraseña/i });
    expect(toggleButtons.length).toBeGreaterThan(0);
    fireEvent.click(toggleButtons[0]);
    expect(screen.getAllByRole('button', { name: /ocultar contraseña/i }).length).toBeGreaterThan(0);
  });
});
