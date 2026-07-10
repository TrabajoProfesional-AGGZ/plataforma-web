import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MorosidadPage from './MorosidadPage';
import { getDashboardFidelizacion } from '../../services/fidelizacionService';
import { usePermiso } from '../../hooks/usePermiso';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/fidelizacionService');
jest.mock('../../hooks/usePermiso');
jest.mock('../../assets/logo_socio.png', () => 'logo.png');

jest.mock('../../components/charts/TendenciasPagoChart', () => ({
  TendenciasPagoChart: ({ datos }) => <div data-testid="mock-chart">{datos.length}</div>,
}));

const mockDatos = {
  periodo_analizado: { desde: '2026-01', hasta: '2026-07' },
  prediccion_morosidad: [
    { socio_id: 1, nombre_completo: 'Juan Pérez', probabilidad_atraso: 0.85, dias_promedio_historico: 25, nivel_riesgo: 'Alto' },
    { socio_id: 2, nombre_completo: 'Ana Gómez', probabilidad_atraso: 0.2, dias_promedio_historico: 3, nivel_riesgo: 'Bajo' },
  ],
  tendencias_pago: [
    { mes: '2026-05', a_termino: 80, fuera_de_termino: 20 },
    { mes: '2026-06', a_termino: 70, fuera_de_termino: 30 },
    { mes: '2026-07', a_termino: 90, fuera_de_termino: 10 },
  ],
};

describe('MorosidadPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra mensaje de error de permisos si no tiene el permiso correspondiente', () => {
    usePermiso.mockReturnValue(false);

    render(<MorosidadPage />);

    expect(screen.getByText('Predicción de Morosidad')).toBeInTheDocument();
    expect(
      screen.getByText('No tenés los permisos necesarios para acceder a las métricas de morosidad del club.')
    ).toBeInTheDocument();
    expect(getDashboardFidelizacion).not.toHaveBeenCalled();
  });

  test('renderiza la predicción de morosidad ordenada por probabilidad de atraso descendente', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockResolvedValueOnce(mockDatos);

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    const filas = screen.getAllByRole('row').slice(1); // sin el header
    expect(filas[0]).toHaveTextContent('Juan Pérez');
    expect(filas[0]).toHaveTextContent('85%');
    expect(filas[0]).toHaveTextContent('Alto');
    expect(filas[1]).toHaveTextContent('Ana Gómez');
    expect(filas[1]).toHaveTextContent('20%');

    expect(screen.getByText('Período analizado: 2026-01 — 2026-07')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  test('muestra un guion cuando la probabilidad de atraso viene nula', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockResolvedValueOnce({
      ...mockDatos,
      prediccion_morosidad: [
        { socio_id: 3, nombre_completo: 'Sin dato', probabilidad_atraso: null, dias_promedio_historico: 0, nivel_riesgo: 'Bajo' },
      ],
    });

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByText('Sin dato')).toBeInTheDocument();
    });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('muestra estado vacío cuando no hay predicciones de morosidad', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockResolvedValueOnce({ ...mockDatos, prediccion_morosidad: [] });

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByText('No hay predicciones de morosidad disponibles.')).toBeInTheDocument();
    });
  });

  test('filtra las tendencias de pago según el rango de meses seleccionado', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockResolvedValueOnce(mockDatos);

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toHaveTextContent('3');
    });

    fireEvent.change(screen.getByLabelText('Desde:'), { target: { value: '2026-06' } });

    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toHaveTextContent('2');
    });

    fireEvent.change(screen.getByLabelText('Hasta:'), { target: { value: '2026-06' } });

    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toHaveTextContent('1');
    });
  });

  test('muestra un mensaje de error si el servicio no está disponible', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockRejectedValueOnce(new Error('servicio-no-disponible'));

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument();
    });
  });

  test('muestra un mensaje de error si no está autorizado', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockRejectedValueOnce(new Error('no-autorizado'));

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByText('No tenés los permisos necesarios para ver esta información.')).toBeInTheDocument();
    });
  });

  test('muestra un error genérico ante un fallo desconocido', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFidelizacion.mockRejectedValueOnce(new Error('error-raro-de-red'));

    render(<MorosidadPage />);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las métricas de morosidad.')).toBeInTheDocument();
    });
  });
});
