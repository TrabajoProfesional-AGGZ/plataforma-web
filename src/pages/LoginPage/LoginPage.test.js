import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as authService from '../../services/authService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/authService');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    logoSocio: 'logo.png',
    logoTexto: 'texto.png',
    logoSocioAlt: 'logo_socio_alt.png',
    logoConTexto: 'logo_con_texto.png',
  }),
}));

let mockReducedMotion = false;
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return { ...actual, useReducedMotion: () => mockReducedMotion };
});

const renderLoginPage = (initialState = {}) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/', state: initialState }]}>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  test('renderiza los campos de email, contraseña y el botón de ingresar', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  test('no muestra el mensaje de error en el estado inicial', () => {
    renderLoginPage();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('muestra cartel de éxito cuando se llega desde cambio de contraseña', () => {
    renderLoginPage({ passwordChanged: true });
    expect(screen.getByRole('status')).toHaveTextContent(/contraseña actualizada correctamente/i);
  });

  test('no muestra cartel de éxito en una visita normal', () => {
    renderLoginPage();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('muestra "Credenciales incorrectas" cuando Firebase rechaza por credenciales inválidas', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales incorrectas');
    });
  });

  test('muestra "Credenciales incorrectas" cuando el backend rechaza el acceso (rol inválido)', async () => {
    authService.login.mockRejectedValueOnce(new Error('unauthorized'));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales incorrectas');
    });
  });

  test('muestra "Servicio no disponible" cuando falla por otro motivo (no de credenciales)', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Servicio no disponible');
    });
  });

  test('deshabilita el botón mientras se procesa el login', async () => {
    authService.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled();
  });

  test('muestra pantalla de carga tras login exitoso', async () => {
    authService.login.mockResolvedValueOnce();
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(document.querySelector('.login-exit-overlay')).toBeInTheDocument();
    });
  });

  test('alterna la visibilidad de la contraseña al hacer click en Mostrar/Ocultar', () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText('Contraseña');
    const toggleBtn = screen.getByRole('button', { name: /mostrar contraseña/i });

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('abre el modal de recuperar contraseña al hacer click en "¿Olvidaste tu contraseña?"', () => {
    renderLoginPage();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();
  });

  test('cierra el modal de recuperar contraseña al presionar Escape', () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('LoginPage - con movimiento reducido preferido', () => {
  beforeEach(() => {
    mockReducedMotion = true;
  });

  afterEach(() => {
    mockReducedMotion = false;
  });

  test('navega directamente al dashboard sin overlay de animación tras login exitoso', async () => {
    authService.login.mockResolvedValueOnce();
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'pass' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    });

    expect(document.querySelector('.login-exit-overlay')).not.toBeInTheDocument();
  });
});
