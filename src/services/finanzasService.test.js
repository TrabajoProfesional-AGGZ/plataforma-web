import { getResumenFinanciero, marcarPagadaCaja } from './finanzasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('finanzasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResumenFinanciero', () => {
    test('llama al endpoint correcto con el id del socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id_socio: 's-1', estado_financiero: 'Activo', deuda_total: 0, cuotas: [] }),
      });

      const result = await getResumenFinanciero('s-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/finanzas/s-1', 'GET');
      expect(result.estado_financiero).toBe('Activo');
    });

    test('encodea caracteres especiales del id de socio', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      await getResumenFinanciero('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/finanzas/123%2F..%2Fx%3Fa%3D1', 'GET');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getResumenFinanciero('s-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getResumenFinanciero('s-1')).rejects.toThrow('Error al obtener el resumen financiero');
    });
  });

  describe('marcarPagadaCaja', () => {
    test('llama al endpoint de cuotas con pagado_en_caja true', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ estado: 'Pagada' }) });

      await marcarPagadaCaja('cuota', 'c-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/internos/cuotas/c-1/marcar-pagada', 'POST', { pagado_en_caja: true });
    });

    test('llama al endpoint de reservas cuando el tipo es reserva', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ estado: 'Confirmada' }) });

      await marcarPagadaCaja('reserva', 'r-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/internos/reservas/r-1/marcar-pagada', 'POST', { pagado_en_caja: true });
    });

    test('llama al endpoint de entradas cuando el tipo es entrada', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ estado: 'Pagada' }) });

      await marcarPagadaCaja('entrada', 'e-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/internos/entradas/e-1/marcar-pagada', 'POST', { pagado_en_caja: true });
    });

    test('encodea caracteres especiales del id', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      await marcarPagadaCaja('cuota', '123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith(
        '/api/v1/internos/cuotas/123%2F..%2Fx%3Fa%3D1/marcar-pagada',
        'POST',
        { pagado_en_caja: true },
      );
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(marcarPagadaCaja('cuota', 'c-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(marcarPagadaCaja('cuota', 'c-1')).rejects.toThrow('Error al marcar como pagada');
    });
  });
});
