import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FinanzasPage from './FinanzasPage';
import { getDashboardFinanzas } from '../../services/metricasService';
import { usePermiso } from '../../hooks/usePermiso';

// Mock de dependencias
jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/metricasService');
jest.mock('../../hooks/usePermiso');
jest.mock('../../assets/logo_socio.png', () => 'logo.png');

// Mockeamos el gráfico para simplificar el testeo de la página
jest.mock('../../components/charts/DesgloseFinanzasChart', () => ({
  DesgloseFinanzasChart: () => <div data-testid="mock-chart">Mock Chart</div>
}));

const mockDataFinanzas = {
  periodo: '2026-07',
  recaudacion_total: 150000,
  desglose: [{ concepto: 'Cuotas', monto: 150000 }]
};

describe('FinanzasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra mensaje de error de permisos si no tiene el rol correspondiente', () => {
    // Forzamos a que el hook diga que NO tiene permiso
    usePermiso.mockReturnValue(false);
    
    render(<FinanzasPage />);
    
    expect(screen.getByText('Dashboard Financiero')).toBeInTheDocument();
    expect(screen.getByText('No tenés los permisos necesarios para acceder a las métricas financieras del club.')).toBeInTheDocument();
    
    // Verificamos que no haya intentado hacer la petición
    expect(getDashboardFinanzas).not.toHaveBeenCalled();
  });

  test('renderiza correctamente los datos si tiene permiso', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFinanzas.mockResolvedValueOnce(mockDataFinanzas);

    render(<FinanzasPage />);

    // Verificamos que muestre el dashboard
    expect(screen.getByText('Dashboard Financiero')).toBeInTheDocument();

    // Esperamos a que los datos asíncronos carguen
    await waitFor(() => {
      // Usamos expresión regular porque el monto incluye signos y separadores (ej: $150.000)
      expect(screen.getByText(/\$150\.000/)).toBeInTheDocument();
    });

    expect(screen.getByText('Periodo: 2026-07')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si el servicio falla', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFinanzas.mockRejectedValueOnce(new Error('servicio-no-disponible'));

    render(<FinanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('El servicio de analíticas no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument();
    });
  });

  test('hace una nueva petición cuando el usuario cambia el periodo en el input', async () => {
    usePermiso.mockReturnValue(true);
    getDashboardFinanzas.mockResolvedValue(mockDataFinanzas); // Resolvemos todas las llamadas

    render(<FinanzasPage />);

    // Esperamos la primera llamada
    await waitFor(() => {
      expect(getDashboardFinanzas).toHaveBeenCalledTimes(1);
    });

    // Buscamos el input type="month" y le cambiamos el valor a Agosto 2026
    const inputMes = screen.getByLabelText(/Período a consultar:/i);
    fireEvent.change(inputMes, { target: { value: '2026-08' } });

    // Verificamos que se haya hecho una segunda llamada con el nuevo periodo
    await waitFor(() => {
      expect(getDashboardFinanzas).toHaveBeenCalledTimes(2);
      expect(getDashboardFinanzas).toHaveBeenLastCalledWith('2026-08');
    });
  });
});

test('muestra un mensaje de error si no está autorizado (ej: error 403)', async () => {
    usePermiso.mockReturnValue(true);
    // Simulamos que el servicio devuelve el string exacto del bloque else if
    getDashboardFinanzas.mockRejectedValueOnce(new Error('no-autorizado'));

    render(<FinanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('No tenés los permisos necesarios para ver esta información.')).toBeInTheDocument();
    });
  });

  test('muestra un error genérico si el servicio falla por un motivo desconocido', async () => {
    usePermiso.mockReturnValue(true);
    // Simulamos un error cualquiera que caiga en el bloque else final
    getDashboardFinanzas.mockRejectedValueOnce(new Error('error-raro-de-red'));

    render(<FinanzasPage />);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las métricas financieras.')).toBeInTheDocument();
    });
  });