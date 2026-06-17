import { getReservas, createReserva, deleteReserva } from './reservasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('reservasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReservas', () => {
    test('llama al endpoint correcto con el id de la instalación', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reservas: [{ id: '1', titulo: 'Partido' }] }),
      });

      const result = await getReservas('inst-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/instalaciones/inst-1/reservas', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve la respuesta directa si no tiene clave reservas', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: '1' }],
      });

      const result = await getReservas('inst-1');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getReservas('inst-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getReservas('inst-1')).rejects.toThrow('Error al obtener reservas');
    });
  });

  describe('createReserva', () => {
    const datos = {
      id_socio: 'socio-uuid-1',
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2026-07-01',
      hora_inicio: '10:00',
      hora_fin: '12:00',
    };

    test('hace POST al endpoint correcto con los datos de la reserva', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'uuid-new', ...datos }),
      });

      await createReserva(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas', 'POST', datos);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createReserva(datos)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico en 400', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createReserva(datos)).rejects.toThrow('Error al crear reserva');
    });
  });

  describe('deleteReserva', () => {
    test('hace DELETE al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await deleteReserva('inst-1', 'reserva-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/instalaciones/inst-1/reservas/reserva-1', 'DELETE');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(deleteReserva('inst-1', 'reserva-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(deleteReserva('inst-1', 'reserva-1')).rejects.toThrow('Error al eliminar reserva');
    });
  });
});
