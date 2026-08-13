import { render, screen } from '@testing-library/react';
import EventosTab from './EventosTab';
import { getTopEventos } from '../../services/metricasService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/metricasService');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getTopEventos.mockResolvedValue({
    ranking: [
      { id: '1', nombre: 'Fiesta aniversario', capacidad_maxima: 200, entradas_vendidas: 150, porcentaje_ocupacion: 75.0 },
    ],
    total: 1,
  });
});

test('muestra el ranking de eventos', async () => {
  render(<EventosTab />);

  expect(await screen.findByText('Fiesta aniversario')).toBeInTheDocument();
  expect(screen.getByText('150 / 200 entradas')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
});

test('muestra una fila con 0 entradas vendidas (outerjoin)', async () => {
  getTopEventos.mockResolvedValue({
    ranking: [
      { id: '2', nombre: 'Evento sin ventas', capacidad_maxima: 100, entradas_vendidas: 0, porcentaje_ocupacion: 0 },
    ],
    total: 1,
  });

  render(<EventosTab />);

  expect(await screen.findByText('Evento sin ventas')).toBeInTheDocument();
  expect(screen.getByText('0 / 100 entradas')).toBeInTheDocument();
});

test('muestra un mensaje de error si el servicio no está disponible', async () => {
  getTopEventos.mockRejectedValueOnce(new Error('servicio-no-disponible'));

  render(<EventosTab />);

  expect(
    await screen.findByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')
  ).toBeInTheDocument();
});

test('muestra un error genérico ante un fallo desconocido', async () => {
  getTopEventos.mockRejectedValueOnce(new Error('error-raro-de-red'));

  render(<EventosTab />);

  expect(await screen.findByText('No se pudieron cargar las métricas de eventos.')).toBeInTheDocument();
});

test('muestra mensaje vacío cuando no hay eventos con ventas', async () => {
  getTopEventos.mockResolvedValue({ ranking: [], total: 0 });

  render(<EventosTab />);

  expect(await screen.findByText('No hay eventos con entradas vendidas.')).toBeInTheDocument();
});
