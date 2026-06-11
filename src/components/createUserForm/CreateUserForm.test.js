import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserForm } from './CreateUserForm';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('framer-motion', () => {
  const mockReact = require('react');
  const motion = new Proxy({}, {
    get: (_, tag) => {
      return ({ children, whileHover, whileTap, initial, animate, exit, transition, variants, custom, ...props }) =>
        mockReact.createElement(tag, props, children);
    },
  });
  return {
    motion,
    AnimatePresence: ({ children }) => children,
  };
});

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

function renderForm() {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<CreateUserForm onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

async function fillStep1() {
  fireEvent.change(screen.getByPlaceholderText('María'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByPlaceholderText('González'), { target: { value: 'López' } });
  fireEvent.change(screen.getByDisplayValue(''), { target: { value: '1990-05-15' } });
}

async function goToStep(targetStep) {
  for (let i = 1; i < targetStep; i++) {
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(new RegExp(`paso ${i + 1} de`, 'i'))).toBeInTheDocument());
  }
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
    renderForm();
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('María')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('González')).toBeInTheDocument();
    await waitFor(() => expect(fetchRoles).toHaveBeenCalled());
  });

  test('llama a onCancel al hacer click en Cancelar en paso 1', async () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(fetchRoles).toHaveBeenCalled());
  });

  test('no avanza al paso 2 si los campos del paso 1 están vacíos', async () => {
    renderForm();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 1 de/i)).toBeInTheDocument();
    });
  });

  test('avanza al paso 2 con campos válidos en paso 1', async () => {
    renderForm();
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 2 de/i)).toBeInTheDocument();
      expect(screen.getByText(/tipo de documento/i)).toBeInTheDocument();
    });
  });

  test('renderiza el paso 4 con el select de roles cargado', async () => {
    renderForm();
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de/i)).toBeInTheDocument());

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'DNI' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. 12345678'), { target: { value: '12345678' } });
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 3 de/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('maria@ejemplo.com'), { target: { value: 'ana@ejemplo.com' } });
    fireEvent.change(screen.getByPlaceholderText(/mínimo 6/i), { target: { value: 'secreta123' } });
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 4 de/i)).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'PRESIDENTE' })).toBeInTheDocument();
    });
  });

  test('muestra error si el rol no fue seleccionado al intentar crear', async () => {
    renderForm();
    await fillStep1();
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de/i)).toBeInTheDocument());

    fireEvent.change(screen.getByText('Seleccionar...').closest('select'), { target: { value: 'DNI' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. 12345678'), { target: { value: '12345678' } });
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 3 de/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('maria@ejemplo.com'), { target: { value: 'ana@ejemplo.com' } });
    fireEvent.change(screen.getByPlaceholderText(/mínimo 6/i), { target: { value: 'secreta123' } });
    userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 4 de/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear usuario/i })).not.toBeDisabled();
    });

    userEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(screen.getByText(/seleccioná un rol/i)).toBeInTheDocument();
    });
    expect(crearUsuario).not.toHaveBeenCalled();
  });

  test('muestra los selects aunque falle la carga de roles', async () => {
    fetchRoles.mockRejectedValue(new Error('network error'));
    renderForm();
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument();
    await waitFor(() => expect(fetchRoles).toHaveBeenCalled());
  });
});
