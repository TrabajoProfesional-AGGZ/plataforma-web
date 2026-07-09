import { render, screen } from '@testing-library/react';

jest.mock('../../services/metricasService', () => ({
  getTopDisciplinas: jest.fn(),
  getOcupacionInstalaciones: jest.fn(),
}));

import MetricasPage from './MetricasPage';
import { getTopDisciplinas, getOcupacionInstalaciones } from '../../services/metricasService';

beforeEach(() => {
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

test('renderiza el título de métricas', async () => {
  render(<MetricasPage />);
  expect(await screen.findByText('Métricas del Club')).toBeInTheDocument();
});

test('muestra el ranking de disciplinas', async () => {
  render(<MetricasPage />);
  expect(await screen.findByText('Natación', {}, { timeout: 3000 })).toBeInTheDocument();
});

test('muestra la ocupación de instalaciones', async () => {
  render(<MetricasPage />);
  expect(await screen.findByText('Cancha', {}, { timeout: 3000 })).toBeInTheDocument();
});