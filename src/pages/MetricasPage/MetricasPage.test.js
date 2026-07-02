import { render, screen, waitFor, act } from '@testing-library/react';

jest.mock('../../services/metricasService', () => ({
  getTopDisciplinas: jest.fn(() => Promise.resolve({
    ranking: [
      { id: '1', nombre: 'Natación', cupo_maximo: 30, total_inscriptos: 25, porcentaje_cupo: 83.3 },
    ],
    total: 1,
  })),
  getOcupacionInstalaciones: jest.fn(() => Promise.resolve({
    instalaciones: [
      { id: '1', nombre: 'Cancha', tipo: 'deportiva', horas_reservadas: 100, horas_disponibles: 420, porcentaje_ocupacion: 23.8 },
    ],
    total: 1,
    promedio_ocupacion: 23.8,
    periodo_dias: 30,
  })),
}));

import MetricasPage from './MetricasPage';

test('renderiza el título de métricas', async () => {
  await act(async () => { render(<MetricasPage />); });
  expect(screen.getByText('Métricas del Club')).toBeInTheDocument();
});

test('muestra el ranking de disciplinas', async () => {
  await act(async () => { render(<MetricasPage />); });
  await waitFor(() => {
    expect(screen.getByText('Natación')).toBeInTheDocument();
  });
});

test('muestra la ocupación de instalaciones', async () => {
  await act(async () => { render(<MetricasPage />); });
  await waitFor(() => {
    expect(screen.getByText('Cancha')).toBeInTheDocument();
  });
});