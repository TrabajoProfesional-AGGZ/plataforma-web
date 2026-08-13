import { render, screen } from '@testing-library/react';
import CajaTab from './CajaTab';
import { getPagosEnCaja } from '../../services/metricasService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/metricasService');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getPagosEnCaja.mockResolvedValue({
    desglose: [
      { tipo: 'cuota', cantidad: 2, monto_total: 40000 },
      { tipo: 'reserva', cantidad: 1, monto_total: 5000 },
      { tipo: 'entrada', cantidad: 3, monto_total: 15000 },
      { tipo: 'compra', cantidad: 0, monto_total: 0 },
    ],
    total_cantidad: 6,
    total_monto: 60000,
  });
});

test('muestra el total pagado en caja', async () => {
  render(<CajaTab />);

  expect(await screen.findByText(/\$60\.000/)).toBeInTheDocument();
  expect(screen.getByText('6 pagos registrados')).toBeInTheDocument();
});

test('muestra el desglose por tipo', async () => {
  render(<CajaTab />);

  expect(await screen.findByText('Cuotas')).toBeInTheDocument();
  expect(screen.getByText('Reservas')).toBeInTheDocument();
  expect(screen.getByText('Entradas')).toBeInTheDocument();
  expect(screen.getByText('Compras')).toBeInTheDocument();
});

test('muestra un tipo con 0 pagos', async () => {
  render(<CajaTab />);

  await screen.findByText('Compras');
  expect(screen.getByText('0 pagos')).toBeInTheDocument();
});

test('muestra un mensaje de error si el servicio no está disponible', async () => {
  getPagosEnCaja.mockRejectedValueOnce(new Error('servicio-no-disponible'));

  render(<CajaTab />);

  expect(
    await screen.findByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')
  ).toBeInTheDocument();
});

test('muestra un error genérico ante un fallo desconocido', async () => {
  getPagosEnCaja.mockRejectedValueOnce(new Error('error-raro-de-red'));

  render(<CajaTab />);

  expect(await screen.findByText('No se pudieron cargar los pagos en caja.')).toBeInTheDocument();
});

test('muestra mensaje vacío cuando no hay pagos en caja', async () => {
  getPagosEnCaja.mockResolvedValue({ desglose: [], total_cantidad: 0, total_monto: 0 });

  render(<CajaTab />);

  expect(await screen.findByText('Todavía no se registraron pagos en caja.')).toBeInTheDocument();
});
