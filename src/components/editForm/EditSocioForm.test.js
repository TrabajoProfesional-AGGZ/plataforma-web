import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditSocioForm } from './EditSocioForm';

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

jest.mock('../../services/catalogosService', () => ({
  fetchEstadosSocio: jest.fn(),
  fetchCategoriasSocio: jest.fn(),
}));

jest.mock('../../services/sociosService', () => ({
  updateSocio: jest.fn(),
}));

const { fetchEstadosSocio, fetchCategoriasSocio } = require('../../services/catalogosService');
const { updateSocio } = require('../../services/sociosService');

const ESTADOS_MOCK = [
  { id: 1, nombre: 'Activo' },
  { id: 2, nombre: 'Moroso' },
  { id: 3, nombre: 'Inactivo' },
];

const CATEGORIAS_MOCK = [
  { id: 1, nombre: 'Juvenil' },
  { id: 2, nombre: 'Senior' },
  { id: 3, nombre: 'Vitalicio' },
];

const SOCIO_MOCK = {
  id: 'uuid-abc-123',
  nombre: 'Juan',
  apellido: 'Pérez',
  fecha_nacimiento: '1990-01-15',
  nro_documento: '12345678',
  email: 'juan@ejemplo.com',
  telefono: '1123456789',
  estado: { id: 1, nombre: 'Activo' },
  categoria: { id: 1, nombre: 'Juvenil' },
};

function renderForm(socio = SOCIO_MOCK) {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<EditSocioForm socio={socio} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

async function navigateToStep3() {
  userEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
  await waitFor(() => expect(screen.getByPlaceholderText('ej: 12345678')).toBeInTheDocument());

  userEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
  await waitFor(() => expect(screen.getByPlaceholderText('ej: juan@ejemplo.com')).toBeInTheDocument());

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).not.toBeDisabled();
  });
}

describe('EditSocioForm', () => {
  beforeEach(() => {
    fetchEstadosSocio.mockResolvedValue(ESTADOS_MOCK);
    fetchCategoriasSocio.mockResolvedValue(CATEGORIAS_MOCK);
    updateSocio.mockResolvedValue({ ...SOCIO_MOCK });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario en el paso 1', async () => {
    renderForm();
    expect(screen.getByText('Editar socio')).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de/)).toBeInTheDocument();
    await screen.findByRole('option', { name: 'Activo' });
  });

  test('carga las opciones del catálogo en los selects de estado y categoría', async () => {
    renderForm();
    await screen.findByRole('option', { name: 'Moroso' });
    expect(fetchEstadosSocio).toHaveBeenCalledTimes(1);
    expect(fetchCategoriasSocio).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: 'Inactivo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Senior' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vitalicio' })).toBeInTheDocument();
  });

  test('pre-rellena los selects con los valores actuales del socio tras cargar el catálogo', async () => {
    renderForm();
    await screen.findByDisplayValue('Activo');
    expect(screen.getByDisplayValue('Activo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Juvenil')).toBeInTheDocument();
  });

  test('incluye estado y categoría en el payload al guardar si tienen valor', async () => {
    renderForm();
    await screen.findByDisplayValue('Activo');

    await navigateToStep3();
    userEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(updateSocio).toHaveBeenCalledTimes(1);
    });

    const payload = updateSocio.mock.calls[0][1];
    expect(payload.estado).toBe('Activo');
    expect(payload.categoria).toBe('Juvenil');
  });

  test('no incluye estado ni categoría en el payload cuando se selecciona sin cambiar', async () => {
    renderForm();
    await screen.findByDisplayValue('Activo');

    fireEvent.change(screen.getByDisplayValue('Activo'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('Juvenil'), { target: { value: '' } });

    await navigateToStep3();
    userEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(updateSocio).toHaveBeenCalledTimes(1);
    });

    const payload = updateSocio.mock.calls[0][1];
    expect(payload.estado).toBeUndefined();
    expect(payload.categoria).toBeUndefined();
  });

  test('muestra los selects aunque falle la carga del catálogo', () => {
    fetchEstadosSocio.mockRejectedValue(new Error('network error'));
    fetchCategoriasSocio.mockRejectedValue(new Error('network error'));

    renderForm();

    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar', async () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await screen.findByRole('option', { name: 'Activo' });
  });
});
