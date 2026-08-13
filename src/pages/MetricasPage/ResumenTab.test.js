import { render, screen } from '@testing-library/react';
import ResumenTab from './ResumenTab';
import { getTopDisciplinas, getOcupacionInstalaciones } from '../../services/metricasService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/metricasService');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getTopDisciplinas.mockResolvedValue({
    ranking: [
      { id: '1', nombre: 'Natación', cupo_maximo: 30, total_inscriptos: 25, porcentaje_cupo: 83.3 },
    ],
    total: 1,
  });
  getOcupacionInstalaciones.mockResolvedValue({
    instalaciones: [
      { id: '1', nombre: 'Cancha', tipo: 'deportiva', horas_reservadas: 100, horas_disponibles: 420, porcentaje_ocupacion: 23.8 },
    ],
    total: 1,
    promedio_ocupacion: 23.8,
    periodo_dias: 30,
  });
});

test('muestra el ranking de disciplinas', async () => {
  render(<ResumenTab />);
  expect(await screen.findByText('Natación')).toBeInTheDocument();
});

test('muestra la ocupación de instalaciones', async () => {
  render(<ResumenTab />);
  expect(await screen.findByText('Cancha')).toBeInTheDocument();
});

test('muestra un mensaje de error si el servicio no está disponible', async () => {
  getTopDisciplinas.mockRejectedValueOnce(new Error('servicio-no-disponible'));

  render(<ResumenTab />);

  expect(
    await screen.findByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')
  ).toBeInTheDocument();
});

test('muestra un error genérico ante un fallo desconocido', async () => {
  getTopDisciplinas.mockRejectedValueOnce(new Error('error-raro-de-red'));

  render(<ResumenTab />);

  expect(await screen.findByText('No se pudieron cargar las métricas. Intentá más tarde.')).toBeInTheDocument();
});

test('muestra "sin límite" para una disciplina sin cupo_maximo', async () => {
  getTopDisciplinas.mockResolvedValue({
    ranking: [
      { id: '1', nombre: 'Yoga', cupo_maximo: null, total_inscriptos: 12, porcentaje_cupo: null },
    ],
    total: 1,
  });

  render(<ResumenTab />);

  expect(await screen.findByText('12 inscriptos (sin límite)')).toBeInTheDocument();
  expect(screen.getByText('Sin límite')).toBeInTheDocument();
});

test('muestra mensaje vacío cuando no hay disciplinas con inscriptos', async () => {
  getTopDisciplinas.mockResolvedValue({ ranking: [], total: 0 });

  render(<ResumenTab />);

  expect(await screen.findByText('No hay disciplinas con inscriptos activos.')).toBeInTheDocument();
});

test('muestra mensaje vacío cuando no hay instalaciones activas', async () => {
  getOcupacionInstalaciones.mockResolvedValue({ instalaciones: [], total: 0, promedio_ocupacion: null, periodo_dias: 30 });

  render(<ResumenTab />);

  expect(await screen.findByText('No hay instalaciones activas.')).toBeInTheDocument();
});

test('ordena las instalaciones por porcentaje de ocupación descendente', async () => {
  getOcupacionInstalaciones.mockResolvedValue({
    instalaciones: [
      { id: '1', nombre: 'Pileta', tipo: 'deportiva', horas_reservadas: 50, horas_disponibles: 420, porcentaje_ocupacion: 11.9 },
      { id: '2', nombre: 'Gimnasio', tipo: 'deportiva', horas_reservadas: 380, horas_disponibles: 420, porcentaje_ocupacion: 90.5 },
      { id: '3', nombre: 'Cancha', tipo: 'deportiva', horas_reservadas: 100, horas_disponibles: 420, porcentaje_ocupacion: 23.8 },
    ],
    total: 3,
    promedio_ocupacion: 42,
    periodo_dias: 30,
  });

  render(<ResumenTab />);

  await screen.findByText('Gimnasio');

  const nombres = screen.getAllByText(/Pileta|Gimnasio|Cancha/).map((el) => el.textContent);
  expect(nombres).toEqual(['Gimnasio', 'Cancha', 'Pileta']);
});
