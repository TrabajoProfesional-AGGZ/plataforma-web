import { render, screen } from '@testing-library/react';
import TiendaTab from './TiendaTab';
import { getTopProductos } from '../../services/metricasService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/metricasService');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getTopProductos.mockResolvedValue({
    ranking: [
      { id: '1', nombre: 'Remera club', cantidad_vendida: 40, monto_total: 200000 },
    ],
    total: 1,
  });
});

test('muestra el ranking de productos', async () => {
  render(<TiendaTab />);

  expect(await screen.findByText('Remera club')).toBeInTheDocument();
  expect(screen.getByText('40 unidades vendidas')).toBeInTheDocument();
  expect(screen.getByText(/\$200\.000/)).toBeInTheDocument();
});

test('muestra una fila con 0 unidades vendidas (outerjoin)', async () => {
  getTopProductos.mockResolvedValue({
    ranking: [
      { id: '2', nombre: 'Producto sin ventas', cantidad_vendida: 0, monto_total: 0 },
    ],
    total: 1,
  });

  render(<TiendaTab />);

  expect(await screen.findByText('Producto sin ventas')).toBeInTheDocument();
  expect(screen.getByText('0 unidades vendidas')).toBeInTheDocument();
});

test('muestra un mensaje de error si el servicio no está disponible', async () => {
  getTopProductos.mockRejectedValueOnce(new Error('servicio-no-disponible'));

  render(<TiendaTab />);

  expect(
    await screen.findByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')
  ).toBeInTheDocument();
});

test('muestra un error genérico ante un fallo desconocido', async () => {
  getTopProductos.mockRejectedValueOnce(new Error('error-raro-de-red'));

  render(<TiendaTab />);

  expect(await screen.findByText('No se pudieron cargar las métricas de la tienda.')).toBeInTheDocument();
});

test('muestra mensaje vacío cuando no hay productos con ventas', async () => {
  getTopProductos.mockResolvedValue({ ranking: [], total: 0 });

  render(<TiendaTab />);

  expect(await screen.findByText('No hay productos con ventas registradas.')).toBeInTheDocument();
});
