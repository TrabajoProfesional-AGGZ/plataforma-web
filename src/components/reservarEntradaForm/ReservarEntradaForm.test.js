import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReservarEntradaForm } from './ReservarEntradaForm';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));
jest.mock('../../services/entradasService', () => ({
  createEntrada: jest.fn(),
}));
jest.mock('../../services/finanzasService', () => ({
  marcarPagadaCaja: jest.fn(),
}));

const { getSocioByNroSocio } = require('../../services/sociosService');
const { createEntrada } = require('../../services/entradasService');
const { marcarPagadaCaja } = require('../../services/finanzasService');

const EVENTO_TEST = { id: 'evento-1', nombre: 'Fiesta Aniversario' };
const SOCIO_TEST = { id: 'socio-uuid-1', nro_socio: '1234', nombre: 'Juan', apellido: 'García' };

function renderForm() {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<ReservarEntradaForm evento={EVENTO_TEST} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

async function buscarSocio(nroSocio = '1234') {
  const input = screen.getByPlaceholderText(/ej\. 1234/i);
  fireEvent.change(input, { target: { value: nroSocio } });
  fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
  expect(await screen.findByText(/García/)).toBeInTheDocument();
}

describe('ReservarEntradaForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSocioByNroSocio.mockResolvedValue(SOCIO_TEST);
    createEntrada.mockResolvedValue({ id: 'entrada-1', estado: 'Pendiente' });
    marcarPagadaCaja.mockResolvedValue({ estado: 'Pagada' });
  });

  test('renderiza el formulario con el nombre del evento', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: 'Reservar entrada' })).toBeInTheDocument();
    expect(screen.getByText('Fiesta Aniversario')).toBeInTheDocument();
  });

  test('el botón de confirmar está deshabilitado hasta encontrar un socio', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /reservar entrada/i })).toBeDisabled();
  });

  test('busca el socio por número y muestra su nombre', async () => {
    renderForm();
    await buscarSocio('1234');
    expect(getSocioByNroSocio).toHaveBeenCalledWith('1234');
    expect(screen.getByRole('button', { name: /reservar entrada/i })).not.toBeDisabled();
  });

  test('muestra error si no se encuentra el socio', async () => {
    getSocioByNroSocio.mockRejectedValueOnce(new Error('no encontrado'));
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '9999' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByText('No se encontró ningún socio con ese número.')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar', () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('al confirmar crea la entrada y la marca como pagada en caja', async () => {
    const { onSuccess } = renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));

    await waitFor(() => {
      expect(createEntrada).toHaveBeenCalledWith({ id_evento: 'evento-1', id_socio: 'socio-uuid-1' });
      expect(marcarPagadaCaja).toHaveBeenCalledWith('entrada', 'entrada-1');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('muestra el error de socio moroso', async () => {
    createEntrada.mockRejectedValueOnce(new Error('socio-moroso'));
    renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));

    expect(await screen.findByText(/regularice su situación financiera/i)).toBeInTheDocument();
  });

  test('muestra el error de sin cupo', async () => {
    createEntrada.mockRejectedValueOnce(new Error('sin_cupo'));
    renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));

    expect(await screen.findByText('No quedan entradas disponibles para este evento.')).toBeInTheDocument();
  });

  test('muestra un error genérico ante fallos desconocidos', async () => {
    createEntrada.mockRejectedValueOnce(new Error('unknown-error'));
    renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));

    expect(await screen.findByText('No se pudo reservar la entrada. Intentá de nuevo.')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en el overlay', () => {
    const { onCancel } = renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
