import { getReservas, getReservasPorInstalacion, getReservasPorSocio, createReserva, deleteReserva, getReservasHistoricas, getReservasHistoricasPorInstalacion, getTurnosDisponibles } from './reservasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('reservasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReservas', () => {
    test('delega en el endpoint por-instalacion (no trae el listado global)', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reservas: [{ id: '1', titulo: 'Partido', id_instalacion: 'inst-1' }] }),
      });

      const result = await getReservas('inst-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/por-instalacion/inst-1', 'GET');
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

  describe('getReservasPorInstalacion', () => {
    test('llama al endpoint correcto con el ID de instalación', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'r-1', id_instalacion: 'inst-1' }],
      });

      const result = await getReservasPorInstalacion('inst-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/por-instalacion/inst-1', 'GET');
      expect(result).toHaveLength(1);
    });

    test('encodea caracteres especiales del id de instalación', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

      await getReservasPorInstalacion('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/por-instalacion/123%2F..%2Fx%3Fa%3D1', 'GET');
    });

    test('devuelve array desde clave reservas si está presente', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reservas: [{ id: 'r-2' }] }),
      });

      const result = await getReservasPorInstalacion('inst-2');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getReservasPorInstalacion('inst-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getReservasPorInstalacion('inst-1')).rejects.toThrow('Error al obtener reservas');
    });
  });

  describe('getReservasPorSocio', () => {
    test('llama al endpoint correcto con el nro de socio', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'r-3', id_socio: 'socio-1' }],
      });

      const result = await getReservasPorSocio('1234');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/por-socio/1234', 'GET');
      expect(result).toHaveLength(1);
    });

    test('encodea caracteres especiales del nro de socio', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

      await getReservasPorSocio('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/por-socio/123%2F..%2Fx%3Fa%3D1', 'GET');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getReservasPorSocio('1234')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getReservasPorSocio('1234')).rejects.toThrow('Error al obtener reservas');
    });
  });

  describe('createReserva', () => {
    const datos = {
      ids_socios: ['socio-uuid-1'],
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2026-07-01',
      hora_inicio: '10:00',
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

    test('lanza "superposicion" cuando la respuesta es 409 sin body reconocible', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 409 });
      await expect(createReserva(datos)).rejects.toThrow('superposicion');
    });

    test('lanza "sin-cupo" cuando la respuesta es 409 con tipo sin_cupo, incluyendo los cupos disponibles', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { tipo: 'sin_cupo', cupos_disponibles: 2 } }),
      });
      try {
        await createReserva(datos);
        throw new Error('no debería llegar acá');
      } catch (e) {
        expect(e.message).toBe('sin-cupo');
        expect(e.cuposDisponibles).toBe(2);
      }
    });

    test('lanza "conflicto-temporal" cuando la respuesta es 409 con tipo conflicto_temporal', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { tipo: 'conflicto_temporal' } }),
      });
      await expect(createReserva(datos)).rejects.toThrow('conflicto-temporal');
    });

    test('lanza "socio-moroso" cuando la respuesta es 403 con tipo moroso', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { tipo: 'moroso', socios_moroso: ['1000'] } }),
      });
      await expect(createReserva(datos)).rejects.toThrow('socio-moroso');
    });

    test('lanza "socio-suspendido" cuando la respuesta es 403 con tipo suspendido', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { tipo: 'suspendido', socios_suspendido: ['1000'] } }),
      });
      await expect(createReserva(datos)).rejects.toThrow('socio-suspendido');
    });

    test('lanza error genérico en 400', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createReserva(datos)).rejects.toThrow('Error al crear reserva');
    });
  });

  describe('getTurnosDisponibles', () => {
    test('llama al endpoint correcto con instalacion y fecha', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ['08:00:00', '09:00:00'],
      });

      const result = await getTurnosDisponibles('inst-1', '2026-10-10');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/turnos-disponibles/inst-1?fecha=2026-10-10', 'GET');
      expect(result).toEqual(['08:00:00', '09:00:00']);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getTurnosDisponibles('inst-1', '2026-10-10')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getTurnosDisponibles('inst-1', '2026-10-10')).rejects.toThrow('Error al obtener turnos disponibles');
    });
  });

  describe('deleteReserva', () => {
    test('hace DELETE al endpoint correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await deleteReserva('inst-1', 'reserva-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/reserva-1', 'DELETE');
    });

    test('encodea caracteres especiales del id de reserva', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200 });

      await deleteReserva('inst-1', '123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/123%2F..%2Fx%3Fa%3D1', 'DELETE');
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

  describe('getReservasHistoricas', () => {
    test('llama al endpoint historicas y devuelve el array', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'r-1', estado: 'Finalizada' }],
      });

      const result = await getReservasHistoricas();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/historicas', 'GET');
      expect(result).toHaveLength(1);
    });

    test('devuelve array desde clave reservas si está presente', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reservas: [{ id: 'r-2' }, { id: 'r-3' }] }),
      });

      const result = await getReservasHistoricas();
      expect(result).toHaveLength(2);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getReservasHistoricas()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getReservasHistoricas()).rejects.toThrow('Error al obtener reservas históricas');
    });
  });

  describe('getReservasHistoricasPorInstalacion', () => {
    test('llama al endpoint correcto con el ID de instalación', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 'r-4', estado: 'Confirmada' }, { id: 'r-5', estado: 'Finalizada' }],
      });

      const result = await getReservasHistoricasPorInstalacion('inst-1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/historicas/por-instalacion/inst-1', 'GET');
      expect(result).toHaveLength(2);
    });

    test('encodea caracteres especiales del id de instalación', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

      await getReservasHistoricasPorInstalacion('123/../x?a=1');

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/reservas/historicas/por-instalacion/123%2F..%2Fx%3Fa%3D1', 'GET');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getReservasHistoricasPorInstalacion('inst-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(getReservasHistoricasPorInstalacion('inst-1')).rejects.toThrow('Error al obtener reservas históricas');
    });
  });
});
