import { fetchTo } from '../utils/utils';
import { getDashboardFidelizacion } from './fidelizacionService';

jest.mock('../firebase', () => ({ auth: {} }));
jest.mock('../utils/utils');

describe('fidelizacionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDashboardFidelizacion llama al endpoint correcto y devuelve el JSON', async () => {
    const mockData = { periodo_analizado: { desde: '2026-01', hasta: '2026-07' }, prediccion_morosidad: [], tendencias_pago: [] };
    fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockData });

    const resultado = await getDashboardFidelizacion();

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/analiticas/fidelizacion', 'GET');
    expect(resultado).toEqual(mockData);
  });

  test('lanza "no-autorizado" ante un 401', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(getDashboardFidelizacion()).rejects.toThrow('no-autorizado');
  });

  test('lanza "no-autorizado" ante un 403', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(getDashboardFidelizacion()).rejects.toThrow('no-autorizado');
  });

  test('lanza "servicio-no-disponible" ante un error 5xx', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(getDashboardFidelizacion()).rejects.toThrow('servicio-no-disponible');
  });

  test('lanza un error genérico ante otras respuestas no exitosas', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(getDashboardFidelizacion()).rejects.toThrow('Error al obtener las métricas de morosidad');
  });
});
