import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CambiarContrasenaPage from './CambiarContrasenaPage';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService');

function renderPage() {
  return render(<CambiarContrasenaPage />);
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

  test('llama a changePassword y muestra mensaje de éxito', async () => {
    authService.changePassword.mockResolvedValueOnce();
    renderPage();

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'actual123' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'nueva456' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'nueva456' } });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith('actual123', 'nueva456');
      expect(screen.getByRole('status')).toHaveTextContent(/actualizada correctamente/i);
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
    });
  });
});
