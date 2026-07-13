import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FinanzasTab from './FinanzasTab';
import { getDashboardFinanzas } from '../../services/metricasService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/metricasService');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../components/charts/DesgloseFinanzasChart', () => ({
  DesgloseFinanzasChart: () => <div data-testid="mock-chart">Mock Chart</div>
}));

const mockDataFinanzas = {
  periodo: '2026-07',
  recaudacion_total: 150000,
  desglose: [{ concepto: 'Cuotas', monto: 150000 }]
};

describe('FinanzasTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente los datos financieros', async () => {
    getDashboardFinanzas.mockResolvedValueOnce(mockDataFinanzas);

    render(<FinanzasTab />);

    await waitFor(() => {
      expect(screen.getByText(/\$150\.000/)).toBeInTheDocument();
    });

    expect(screen.getByText('Periodo: 2026-07')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si el servicio falla', async () => {
    getDashboardFinanzas.mockRejectedValueOnce(new Error('servicio-no-disponible'));

    render(<FinanzasTab />);

    await waitFor(() => {
      expect(screen.getByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument();
    });
  });

  test('muestra un mensaje de error si no está autorizado (ej: error 403)', async () => {
    getDashboardFinanzas.mockRejectedValueOnce(new Error('no-autorizado'));

    render(<FinanzasTab />);

    await waitFor(() => {
      expect(screen.getByText('No tenés los permisos necesarios para ver esta información.')).toBeInTheDocument();
    });
  });

  test('muestra un error genérico si el servicio falla por un motivo desconocido', async () => {
    getDashboardFinanzas.mockRejectedValueOnce(new Error('error-raro-de-red'));

    render(<FinanzasTab />);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las métricas financieras.')).toBeInTheDocument();
    });
  });

  test('muestra un mensaje de error si el backend responde con un body malformado (sin recaudacion_total)', async () => {
    getDashboardFinanzas.mockResolvedValueOnce({});

    render(<FinanzasTab />);

    await waitFor(() => {
      expect(screen.getByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument();
    });
  });

  test('hace una nueva petición cuando el usuario cambia el periodo en el input', async () => {
    getDashboardFinanzas.mockResolvedValue(mockDataFinanzas);

    render(<FinanzasTab />);

    await waitFor(() => {
      expect(getDashboardFinanzas).toHaveBeenCalledTimes(1);
    });

    const inputMes = screen.getByLabelText(/Período a consultar:/i);
    fireEvent.change(inputMes, { target: { value: '2026-08' } });

    await waitFor(() => {
      expect(getDashboardFinanzas).toHaveBeenCalledTimes(2);
      expect(getDashboardFinanzas).toHaveBeenLastCalledWith('2026-08');
    });
  });
});
