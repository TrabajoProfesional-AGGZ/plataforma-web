import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CambiarRolForm } from './CambiarRolForm';

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
  cambiarRolUsuario: jest.fn(),
}));
const { cambiarRolUsuario } = require('../../services/usuariosService');

const ROLES_MOCK = [
  { id: 1, nombre: 'ADMIN' },
  { id: 2, nombre: 'PRESIDENTE' },
];

const USUARIO_MOCK = {
  id: 'uuid-abc-123',
  nombre: 'Carlos',
  apellido: 'Rodríguez',
  rol: { nombre: 'ADMIN', permisos: [] },
  estado: { nombre: 'Activo' },
};

function renderForm(usuario = USUARIO_MOCK) {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<CambiarRolForm usuario={usuario} roles={ROLES_MOCK} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

describe('CambiarRolForm', () => {
  beforeEach(() => {
    cambiarRolUsuario.mockResolvedValue({ ...USUARIO_MOCK, rol: { nombre: 'PRESIDENTE', permisos: [] } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario con el nombre del usuario y el select de roles', () => {
    renderForm();
    expect(screen.getByText('Cambiar rol')).toBeInTheDocument();
    expect(screen.getByText(/Carlos Rodríguez/)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PRESIDENTE' })).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar en la fase de selección', () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('al clickear Confirmar muestra la advertencia en amarillo', () => {
    renderForm();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PRESIDENTE' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/advertencia/i)).toBeInTheDocument();
    expect(screen.getByText(/modifica también sus permisos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sí$/i })).toBeInTheDocument();
  });

  test('el botón Confirmar está deshabilitado si no se seleccionó un rol', () => {
    renderForm();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
  });

  test('Cancelar en la fase de confirmación vuelve a la selección', () => {
    renderForm();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PRESIDENTE' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByText(/advertencia/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByText(/advertencia/i)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('al hacer click en Sí llama a cambiarRolUsuario y luego a onSuccess', async () => {
    const { onSuccess } = renderForm();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PRESIDENTE' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    fireEvent.click(screen.getByRole('button', { name: /^sí$/i }));

    await waitFor(() => {
      expect(cambiarRolUsuario).toHaveBeenCalledWith(USUARIO_MOCK.id, 'PRESIDENTE');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('muestra error y vuelve a selección si falla el servicio', async () => {
    cambiarRolUsuario.mockRejectedValue(new Error('servicio-no-disponible'));
    renderForm();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PRESIDENTE' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    fireEvent.click(screen.getByRole('button', { name: /^sí$/i }));

    await waitFor(() => {
      expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  test('muestra error genérico ante fallos desconocidos', async () => {
    cambiarRolUsuario.mockRejectedValue(new Error('unknown-error'));
    renderForm();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PRESIDENTE' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    fireEvent.click(screen.getByRole('button', { name: /^sí$/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al cambiar el rol/i)).toBeInTheDocument();
    });
  });

  test('llama a onCancel al hacer click en el overlay', () => {
    const { onCancel } = renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
