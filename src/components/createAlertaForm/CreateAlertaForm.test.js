import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateAlertaForm } from './CreateAlertaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../services/catalogosService', () => ({
  fetchCategoriasSocio: jest.fn(),
  fetchEstadosSocio: jest.fn(),
}));

const { fetchCategoriasSocio, fetchEstadosSocio } = require('../../services/catalogosService');

const CATEGORIAS_MOCK = [
  { id: 1, nombre: 'Juvenil' },
  { id: 2, nombre: 'Senior' },
];

const ESTADOS_MOCK = [
  { id: 1, nombre: 'Activo' },
  { id: 2, nombre: 'Moroso' },
];

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm() {
  return render(<CreateAlertaForm onSuccess={onSuccess} onCancel={onCancel} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  fetchCategoriasSocio.mockResolvedValue(CATEGORIAS_MOCK);
  fetchEstadosSocio.mockResolvedValue(ESTADOS_MOCK);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateAlertaForm', () => {
  test('renderiza el formulario con el título "Nueva alerta"', () => {
    renderForm();
    expect(screen.getByText('Nueva alerta')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer clic en Cancelar', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al presionar ESC', () => {
    renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('no envía si el mensaje está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar alerta/i }));
    await waitFor(() => {
      expect(screen.getByText('El mensaje es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no rompe el formulario si falla la carga del catálogo', async () => {
    fetchCategoriasSocio.mockRejectedValue(new Error('error de red'));
    renderForm();
    await waitFor(() => {
      expect(fetchCategoriasSocio).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Nueva alerta')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
  });

  test('carga las opciones de categoría y estado desde el catálogo', async () => {
    renderForm();
    await waitFor(() => {
      expect(fetchCategoriasSocio).toHaveBeenCalledTimes(1);
      expect(fetchEstadosSocio).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Juvenil')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  test('muestra pantalla de éxito y llama onSuccess sin filtros', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/redactá el mensaje/i), { target: { value: 'Mensaje de prueba' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /enviar alerta/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('¡Alerta enviada!')).toBeInTheDocument();
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      mensaje: 'Mensaje de prueba',
      filtro_categoria: null,
      filtro_estado: null,
    });
  });

  test('llama onSuccess con los filtros seleccionados', async () => {
    renderForm();
    await waitFor(() => expect(screen.getByText('Juvenil')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/redactá el mensaje/i), { target: { value: 'Con filtros' } });
    const [selectCategoria, selectEstado] = screen.getAllByRole('combobox');
    fireEvent.change(selectCategoria, { target: { value: 'Juvenil' } });
    fireEvent.change(selectEstado, { target: { value: 'Moroso' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /enviar alerta/i }));
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      mensaje: 'Con filtros',
      filtro_categoria: 'Juvenil',
      filtro_estado: 'Moroso',
    });
  });
});
