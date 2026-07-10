import { getDashboardFinanzas, getTopDisciplinas, getOcupacionInstalaciones } from './metricasService';

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

const DISCIPLINAS_MOCK = {
  ranking: [
    { id: '1', nombre: 'Natación', cupo_maximo: 30, total_inscriptos: 25, porcentaje_cupo: 83.3 },
  ],
  total: 1,
};

const OCUPACION_MOCK = {
  instalaciones: [
    { id: '1', nombre: 'Cancha', tipo: 'deportiva', horas_reservadas: 100, horas_disponibles: 420, porcentaje_ocupacion: 23.8 },
  ],
  total: 1,
  promedio_ocupacion: 23.8,
  periodo_dias: 30,
};

describe('metricasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopDisciplinas', () => {
    test('llama al endpoint correcto con el límite indicado', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => DISCIPLINAS_MOCK });

      const result = await getTopDisciplinas(5);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/metricas/disciplinas/top?limite=5', 'GET');
      expect(result.ranking).toHaveLength(1);
    });

    test('lanza "servicio-no-disponible" en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getTopDisciplinas(5)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok (ej: 404)', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(getTopDisciplinas(5)).rejects.toThrow('Error al obtener ranking de disciplinas');
    });
  });

  describe('getOcupacionInstalaciones', () => {
    test('llama al endpoint correcto con los días indicados', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => OCUPACION_MOCK });

      const result = await getOcupacionInstalaciones(30);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/metricas/instalaciones/ocupacion?dias=30', 'GET');
      expect(result.instalaciones).toHaveLength(1);
    });

    test('lanza "servicio-no-disponible" en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getOcupacionInstalaciones(30)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok (ej: 404)', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(getOcupacionInstalaciones(30)).rejects.toThrow('Error al obtener ocupación de instalaciones');
    });
  });

  describe('getDashboardFinanzas', () => {
    test('llama al endpoint correcto con GET y le pasa el periodo en la URL', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => FINANZAS_MOCK });
      
      const result = await getDashboardFinanzas('2026-07');
      
      // Al usar fetch, los query params se concatenan en la URL
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/metricas/finanzas?periodo=2026-07', 'GET');
      expect(result.recaudacion_total).toBe(150000);
    });

    test('encodea caracteres especiales del periodo', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => FINANZAS_MOCK });

      await getDashboardFinanzas('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/metricas/finanzas?periodo=123%2F..%2Fx%3Fa%3D1', 'GET');
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