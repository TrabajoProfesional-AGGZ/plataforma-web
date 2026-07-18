import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateAlertaForm } from './CreateAlertaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../services/catalogosService', () => ({
  fetchCategoriasSocio: jest.fn(),
  fetchEstadosSocio: jest.fn(),
}));

jest.mock('../../services/sociosService', () => ({
  buscarSocioPorTexto: jest.fn(),
}));

const { fetchCategoriasSocio, fetchEstadosSocio } = require('../../services/catalogosService');
const { buscarSocioPorTexto } = require('../../services/sociosService');

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
    fireEvent.change(screen.getByLabelText(/categoría societaria/i), { target: { value: 'Juvenil' } });
    fireEvent.change(screen.getByLabelText(/estado financiero/i), { target: { value: 'Moroso' } });

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

  describe('modo "Socios específicos"', () => {
    function cambiarAModoSocios() {
      fireEvent.change(screen.getByLabelText(/destinatarios/i), { target: { value: 'socios' } });
    }

    test('oculta los filtros de categoría/estado y muestra el buscador de socios', () => {
      renderForm();
      cambiarAModoSocios();
      expect(screen.queryByLabelText(/categoría societaria/i)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/n° de socio, email o id/i)).toBeInTheDocument();
    });

    test('agrega un socio encontrado a la lista y lo muestra como chip', async () => {
      buscarSocioPorTexto.mockResolvedValueOnce({ id: 'uuid-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Gómez' });
      renderForm();
      cambiarAModoSocios();

      fireEvent.change(screen.getByPlaceholderText(/n° de socio, email o id/i), { target: { value: '1000' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
      });

      expect(buscarSocioPorTexto).toHaveBeenCalledWith('1000');
      expect(await screen.findByText(/1000 — Gómez Ana/)).toBeInTheDocument();
    });

    test('muestra error si el socio buscado no existe', async () => {
      buscarSocioPorTexto.mockRejectedValueOnce(new Error('socio-no-encontrado'));
      renderForm();
      cambiarAModoSocios();

      fireEvent.change(screen.getByPlaceholderText(/n° de socio, email o id/i), { target: { value: 'nadie@club.com' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
      });

      expect(await screen.findByText(/no se encontró ningún socio/i)).toBeInTheDocument();
    });

    test('no permite agregar el mismo socio dos veces', async () => {
      buscarSocioPorTexto.mockResolvedValue({ id: 'uuid-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Gómez' });
      renderForm();
      cambiarAModoSocios();

      const input = screen.getByPlaceholderText(/n° de socio, email o id/i);
      fireEvent.change(input, { target: { value: '1000' } });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Agregar' })); });

      fireEvent.change(input, { target: { value: '1000' } });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Agregar' })); });

      expect(await screen.findByText(/este socio ya fue agregado/i)).toBeInTheDocument();
      expect(screen.getAllByText(/1000 — Gómez Ana/)).toHaveLength(1);
    });

    test('permite quitar un socio agregado', async () => {
      buscarSocioPorTexto.mockResolvedValueOnce({ id: 'uuid-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Gómez' });
      renderForm();
      cambiarAModoSocios();

      fireEvent.change(screen.getByPlaceholderText(/n° de socio, email o id/i), { target: { value: '1000' } });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Agregar' })); });
      await screen.findByText(/1000 — Gómez Ana/);

      fireEvent.click(screen.getByRole('button', { name: /quitar socio 1000/i }));
      expect(screen.queryByText(/1000 — Gómez Ana/)).not.toBeInTheDocument();
    });

    test('bloquea el envío si no se agregó ningún socio', async () => {
      renderForm();
      cambiarAModoSocios();

      fireEvent.change(screen.getByPlaceholderText(/redactá el mensaje/i), { target: { value: 'Sin destinatarios' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /enviar alerta/i }));
      });

      expect(await screen.findByText(/debe agregar al menos un socio/i)).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test('llama onSuccess con ids_socios en vez de filtros', async () => {
      buscarSocioPorTexto.mockResolvedValueOnce({ id: 'uuid-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Gómez' });
      renderForm();
      cambiarAModoSocios();

      fireEvent.change(screen.getByPlaceholderText(/redactá el mensaje/i), { target: { value: 'Para vos' } });
      fireEvent.change(screen.getByPlaceholderText(/n° de socio, email o id/i), { target: { value: '1000' } });
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Agregar' })); });
      await screen.findByText(/1000 — Gómez Ana/);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /enviar alerta/i }));
      });
      await act(async () => { jest.advanceTimersByTime(1800); });

      expect(onSuccess).toHaveBeenCalledWith({ mensaje: 'Para vos', ids_socios: ['uuid-1'] });
    });
  });
});
