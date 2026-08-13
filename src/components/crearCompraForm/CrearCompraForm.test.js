import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CrearCompraForm } from './CrearCompraForm';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));
jest.mock('../../services/comprasService', () => ({
  crearCompra: jest.fn(),
}));
jest.mock('../../services/finanzasService', () => ({
  marcarPagadaCaja: jest.fn(),
}));

const { getSocioByNroSocio } = require('../../services/sociosService');
const { crearCompra } = require('../../services/comprasService');
const { marcarPagadaCaja } = require('../../services/finanzasService');

const PRODUCTO_TEST = { id: 'producto-1', nombre: 'Remera oficial', stock: 5 };
const SOCIO_TEST = { id: 'socio-uuid-1', nro_socio: '1234', nombre: 'Juan', apellido: 'García' };

function renderForm() {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<CrearCompraForm producto={PRODUCTO_TEST} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

async function buscarSocio(nroSocio = '1234') {
  const input = screen.getByPlaceholderText(/ej\. 1234/i);
  fireEvent.change(input, { target: { value: nroSocio } });
  fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
  expect(await screen.findByText(/García/)).toBeInTheDocument();
}

describe('CrearCompraForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSocioByNroSocio.mockResolvedValue(SOCIO_TEST);
    crearCompra.mockResolvedValue({ id: 'compra-1', estado: 'Iniciada' });
    marcarPagadaCaja.mockResolvedValue({ estado: 'Pagada' });
  });

  test('renderiza el formulario con el nombre del producto', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: 'Crear compra' })).toBeInTheDocument();
    expect(screen.getByText('Remera oficial')).toBeInTheDocument();
  });

  test('la cantidad por defecto es 1', () => {
    renderForm();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  test('el botón de confirmar está deshabilitado hasta encontrar un socio', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /crear compra/i })).toBeDisabled();
  });

  test('busca el socio por número y muestra su nombre', async () => {
    renderForm();
    await buscarSocio('1234');
    expect(getSocioByNroSocio).toHaveBeenCalledWith('1234');
    expect(screen.getByRole('button', { name: /crear compra/i })).not.toBeDisabled();
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

  test('al confirmar crea la compra con la cantidad elegida y la marca como pagada en caja', async () => {
    const { onSuccess } = renderForm();
    await buscarSocio('1234');
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /crear compra/i }));

    await waitFor(() => {
      expect(crearCompra).toHaveBeenCalledWith({ id_producto: 'producto-1', id_socio: 'socio-uuid-1', cantidad: 3 });
      expect(marcarPagadaCaja).toHaveBeenCalledWith('compra', 'compra-1');
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('la cantidad no puede superar el stock del producto', () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '99' } });
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  test('muestra el error de socio moroso', async () => {
    crearCompra.mockRejectedValueOnce(new Error('moroso'));
    renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /crear compra/i }));

    expect(await screen.findByText(/regularice su situación financiera/i)).toBeInTheDocument();
  });

  test('muestra el error de sin stock', async () => {
    crearCompra.mockRejectedValueOnce(new Error('sin_stock'));
    renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /crear compra/i }));

    expect(await screen.findByText('No queda stock suficiente de este producto.')).toBeInTheDocument();
  });

  test('muestra un error genérico ante fallos desconocidos', async () => {
    crearCompra.mockRejectedValueOnce(new Error('unknown-error'));
    renderForm();
    await buscarSocio('1234');
    fireEvent.click(screen.getByRole('button', { name: /crear compra/i }));

    expect(await screen.findByText('No se pudo crear la compra. Intentá de nuevo.')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en el overlay', () => {
    const { onCancel } = renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
