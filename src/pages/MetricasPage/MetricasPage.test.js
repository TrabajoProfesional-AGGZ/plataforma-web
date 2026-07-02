import { render, screen } from '@testing-library/react';

jest.mock('../../services/metricasService', () => ({
  getTopDisciplinas: jest.fn().mockResolvedValue({
    ranking: [
      { id: '1', nombre: 'Natación', cupo_maximo: 30, total_inscriptos: 25, porcentaje_cupo: 83.3 },
    ],
    total: 1,
  }),
  getOcupacionInstalaciones: jest.fn().mockResolvedValue({
    instalaciones: [
      { id: '1', nombre: 'Cancha', tipo: 'deportiva', horas_reservadas: 100, horas_disponibles: 420, porcentaje_ocupacion: 23.8 },
    ],
    total: 1,
    promedio_ocupacion: 23.8,
    periodo_dias: 30,
  }),
}));

import MetricasPage from './MetricasPage';

test('renderiza el título de métricas', async () => {
  render(<MetricasPage />);
  const titulo = await screen.findByText('Métricas del Club');
  expect(titulo).toBeInTheDocument();
});

test('muestra el ranking de disciplinas', async () => {
  render(<MetricasPage />);
  const natacion = await screen.findByText('Natación');
  expect(natacion).toBeInTheDocument();
});

test('muestra la ocupación de instalaciones', async () => {
  render(<MetricasPage />);
  const cancha = await screen.findByText('Cancha');
  expect(cancha).toBeInTheDocument();
});
