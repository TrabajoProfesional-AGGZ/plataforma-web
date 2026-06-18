import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserForm } from './CreateUserForm';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('../../services/usuariosService', () => ({
  crearUsuario: jest.fn(),
}));

jest.mock('../../services/rolesService', () => ({
  fetchRoles: jest.fn(),
}));

const { crearUsuario } = require('../../services/usuariosService');
const { fetchRoles } = require('../../services/rolesService');

const ROLES_MOCK = [
  { id: 1, nombre: 'ADMIN' },
  { id: 2, nombre: 'PRESIDENTE' },
];

async function renderForm() {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<CreateUserForm onSuccess={onSuccess} onCancel={onCancel} />);
  await act(async () => {});
  return { onSuccess, onCancel };
}

async function fillStep1() {
  fireEvent.change(screen.getByPlaceholderText('María'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByPlaceholderText('González'), { target: { value: 'López' } });
  fireEvent.change(screen.getByDisplayValue(''), { target: { value: '1990-05-15' } });
}

async function fillStep2() {
  fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'DNI' } });
  fireEvent.change(screen.getByPlaceholderText('Ej. 12345678'), { target: { value: '12345678' } });
}

async function fillStep3() {
  fireEvent.change(screen.getByPlaceholderText('maria@ejemplo.com'), { target: { value: 'ana@ejemplo.com' } });
  fireEvent.change(screen.getByPlaceholderText(/mínimo 6/i), { target: { value: 'secreta123' } });
}

async function navigateToStep4(onSuccess, onCancel) {
  render(<CreateUserForm onSuccess={onSuccess} onCancel={onCancel} />);
  await act(async () => {});

  await fillStep1();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/paso 2 de/i)).toBeInTheDocument());

  fillStep2();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/paso 3 de/i)).toBeInTheDocument());

  fillStep3();
  userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/paso 4 de/i)).toBeInTheDocument());
  await waitFor(() => expect(screen.getByRole('button', { name: /crear usuario/i })).not.toBeDisabled());
}

describe('CreateUserForm', () => {
  beforeEach(() => {
    fetchRoles.mockResolvedValue(ROLES_MOCK);
    crearUsuario.mockResolvedValue({ id: 'uuid-new' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el paso 1 con los campos personales', async () => {
    await renderForm();
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('María')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('González')).toBeInTheDocument();
    await waitFor(() => expect(fetchRoles).toHaveBeenCalled());
  });

  test('llama a onCancel al hacer click en Cancelar en paso 1', async () => {
    const { onCancel } = await renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(fetchRoles).toHaveBeenCalled());
  });

  test('no avanza al paso 2 si los campos del paso 1 están vacíos', async () => {
    await renderForm();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 1 de/i)).toBeInTheDocument();
    });
  });

  test('avanza al paso 2 con campos válidos en paso 1', async () => {
    await renderForm();
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 2 de/i)).toBeInTheDocument();
      expect(screen.getByText(/tipo de documento/i)).toBeInTheDocument();
    });
  });

  test('renderiza el paso 4 con el select de roles cargado', async () => {
    await navigateToStep4(jest.fn(), jest.fn());
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'PRESIDENTE' })).toBeInTheDocument();
    });
  });

  test('muestra error si el rol no fue seleccionado al intentar crear', async () => {
    await navigateToStep4(jest.fn(), jest.fn());
    await waitFor(() => expect(screen.getByRole('button', { name: /crear usuario/i })).not.toBeDisabled());

    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(screen.getByText(/seleccioná un rol/i)).toBeInTheDocument();
    });
    expect(crearUsuario).not.toHaveBeenCalled();
  });

  test('muestra los selects aunque falle la carga de roles', async () => {
    fetchRoles.mockRejectedValue(new Error('network error'));
    await renderForm();
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
    await waitFor(() => expect(fetchRoles).toHaveBeenCalled());
  });

  test('retrocede al paso 1 al hacer click en Atrás desde el paso 2', async () => {
    const { onSuccess, onCancel } = await renderForm();
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de/i)).toBeInTheDocument());

    userEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de/i)).toBeInTheDocument());
  });

  test('llama a onCancel al hacer click en el overlay', async () => {
    const { onCancel } = await renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('completa el flujo de 4 pasos y muestra pantalla de éxito', async () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    await navigateToStep4(onSuccess, onCancel);

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'ADMIN' } });
    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => expect(screen.getByText('¡Usuario creado!')).toBeInTheDocument());
  });

  test('llama a onSuccess tras 1800ms de la pantalla de éxito', async () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    await navigateToStep4(onSuccess, onCancel);

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'ADMIN' } });
    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => expect(screen.getByText('¡Usuario creado!')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  test('muestra error de usuario duplicado al crear', async () => {
    crearUsuario.mockRejectedValue(new Error('usuario-duplicado'));
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    await navigateToStep4(onSuccess, onCancel);

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'ADMIN' } });
    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => expect(screen.getByText(/ya existe un usuario/i)).toBeInTheDocument());
  });

  test('muestra error de servicio no disponible al crear', async () => {
    crearUsuario.mockRejectedValue(new Error('servicio-no-disponible'));
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    await navigateToStep4(onSuccess, onCancel);

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'ADMIN' } });
    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => expect(screen.getByText(/servicio no está disponible/i)).toBeInTheDocument());
  });

  test('muestra error genérico ante fallos desconocidos', async () => {
    crearUsuario.mockRejectedValue(new Error('unknown-error'));
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    await navigateToStep4(onSuccess, onCancel);

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'ADMIN' } });
    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => expect(screen.getByText(/error al crear el usuario/i)).toBeInTheDocument());
  });
});
