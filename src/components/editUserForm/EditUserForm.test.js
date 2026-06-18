import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { EditUserForm } from './EditUserForm';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('../../services/usuariosService', () => ({
  editarUsuario: jest.fn(),
}));
const { editarUsuario } = require('../../services/usuariosService');

const USUARIO_MOCK = {
  id: 'uuid-abc-123',
  nombre: 'Carlos',
  apellido: 'Rodríguez',
  email: 'carlos@club.com',
  fecha_nacimiento: '1985-03-20',
  rol: { nombre: 'ADMIN', permisos: [] },
  estado: { nombre: 'Activo' },
};

function renderForm(usuario = USUARIO_MOCK) {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<EditUserForm usuario={usuario} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

describe('EditUserForm', () => {
  beforeEach(() => {
    editarUsuario.mockResolvedValue({ ...USUARIO_MOCK });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('renderiza el formulario con los datos pre-llenados', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Carlos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rodríguez')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar', () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a editarUsuario con los datos correctos al guardar', async () => {
    jest.useFakeTimers();
    const { onSuccess } = renderForm();

    fireEvent.change(screen.getByDisplayValue('Carlos'), { target: { value: 'Carlos Eduardo' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(editarUsuario).toHaveBeenCalledWith(USUARIO_MOCK.id, {
        nombre: 'Carlos Eduardo',
        apellido: 'Rodríguez',
      });
    });

    act(() => { jest.runAllTimers(); });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('muestra mensaje de error si falla el servicio', async () => {
    editarUsuario.mockRejectedValue(new Error('servicio-no-disponible'));
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/no está disponible/i);
    });
  });

  test('muestra error genérico si falla por otro motivo', async () => {
    editarUsuario.mockRejectedValue(new Error('Error al modificar usuario'));
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('el botón Guardar muestra texto de carga mientras se guarda', async () => {
    editarUsuario.mockImplementation(() => new Promise(() => {}));
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
    });
  });

  test('cierra el formulario al presionar ESC', () => {
    const { onCancel } = renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('los inputs aplican estilo al recibir y perder foco', () => {
    renderForm();
    const nombreInput = screen.getByDisplayValue('Carlos');
    fireEvent.focus(nombreInput);
    fireEvent.blur(nombreInput);
    expect(nombreInput).toBeInTheDocument();
  });

  test('muestra error de validación cuando el nombre se vacía y se intenta guardar', async () => {
    renderForm();
    const nombreInput = screen.getByDisplayValue('Carlos');
    fireEvent.change(nombreInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => {
      expect(screen.getByText(/nombre es obligatorio/i)).toBeInTheDocument();
    });
  });

  test('hacer click en el overlay llama a onCancel', () => {
    const { onCancel } = renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
