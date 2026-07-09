import { getDashboardFinanzas } from './metricasService';

// Mockeamos la utilidad de fetch exactamente como en el resto de los servicios
jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

const FINANZAS_MOCK = {
  periodo: '2026-07',
  recaudacion_total: 150000,
  desglose: [
    { concepto: 'Cuotas', monto: 100000 },
    { concepto: 'Alquileres', monto: 50000 }
  ]
};

describe('metricasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardFinanzas', () => {
    test('llama al endpoint correcto con GET y le pasa el periodo en la URL', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => FINANZAS_MOCK });
      
      const result = await getDashboardFinanzas('2026-07');
      
      // Al usar fetch, los query params se concatenan en la URL
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/metricas/finanzas?periodo=2026-07', 'GET');
      expect(result.recaudacion_total).toBe(150000);
    });

    test('llama al endpoint base si no se especifica un periodo', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => FINANZAS_MOCK });
      
      await getDashboardFinanzas(null);
      
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/metricas/finanzas', 'GET');
    });

    test('lanza "no-autorizado" si el status es 403', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 403 });
      
      await expect(getDashboardFinanzas('2026-07')).rejects.toThrow('no-autorizado');
    });

    test('lanza "servicio-no-disponible" en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      
      await expect(getDashboardFinanzas('2026-07')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok (ej: 404)', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      
      await expect(getDashboardFinanzas('2026-07')).rejects.toThrow('Error al obtener métricas de finanzas');
    });
  });
});