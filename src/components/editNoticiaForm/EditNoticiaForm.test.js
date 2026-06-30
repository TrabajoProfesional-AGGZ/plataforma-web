import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { EditNoticiaForm } from './EditNoticiaForm';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('../../services/noticiasService', () => ({
  editarNoticia: jest.fn(),
}));
const { editarNoticia } = require('../../services/noticiasService');

const NOTICIA_MOCK = {
  id: 'n-uuid-123',
  titulo: 'Título original',
  cuerpo: 'Cuerpo original de la noticia.',
  fecha_publicacion: '2026-06-01',
  fecha_expiracion: '2026-07-01',
  estado: 'Publicada',
  imagen: null,
};

function renderForm(noticia = NOTICIA_MOCK) {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<EditNoticiaForm noticia={noticia} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

describe('EditNoticiaForm', () => {
  beforeEach(() => {
    editarNoticia.mockResolvedValue({ ...NOTICIA_MOCK, titulo: 'Título actualizado', cuerpo: 'Cuerpo actualizado' });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('renderiza el formulario con los datos pre-llenados', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: /editar noticia/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Título original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cuerpo original de la noticia.')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer clic en Cancelar', () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al presionar ESC', () => {
    const { onCancel } = renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al hacer clic en el overlay', () => {
    const { onCancel } = renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a editarNoticia con los datos correctos al guardar', async () => {
    jest.useFakeTimers();
    const { onSuccess } = renderForm();

    fireEvent.change(screen.getByDisplayValue('Título original'), { target: { value: 'Título editado' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(editarNoticia).toHaveBeenCalledWith(NOTICIA_MOCK.id, {
        titulo: 'Título editado',
        cuerpo: 'Cuerpo original de la noticia.',
      });
    });

    act(() => { jest.runAllTimers(); });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('muestra mensaje de error si falla el servicio (servicio-no-disponible)', async () => {
    editarNoticia.mockRejectedValue(new Error('servicio-no-disponible'));
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no está disponible/i);
    });
  });

  test('muestra error genérico si falla por otro motivo', async () => {
    editarNoticia.mockRejectedValue(new Error('Error al editar noticia'));
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('el botón Guardar muestra texto de carga mientras se guarda', async () => {
    editarNoticia.mockImplementation(() => new Promise(() => {}));
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
    });
  });

  test('muestra error de validación si el título se vacía', async () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue('Título original'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => {
      expect(screen.getByText(/título es obligatorio/i)).toBeInTheDocument();
    });
  });

  test('muestra error de validación si el cuerpo se vacía', async () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue('Cuerpo original de la noticia.'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => {
      expect(screen.getByText(/cuerpo es obligatorio/i)).toBeInTheDocument();
    });
  });
});
