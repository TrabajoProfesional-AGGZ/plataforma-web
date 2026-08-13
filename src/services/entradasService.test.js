import { createEntrada } from './entradasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('entradasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEntrada', () => {
    const datos = { id_evento: 'evento-1', id_socio: 'socio-1' };

    test('hace POST al endpoint correcto con los datos de la entrada', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'entrada-1', estado: 'Pendiente' }),
      });

      await createEntrada(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/entradas', 'POST', datos);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createEntrada(datos)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza "socio-moroso" cuando la respuesta es 403 con tipo moroso', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { tipo: 'moroso', socio: '1000' } }),
      });
      await expect(createEntrada(datos)).rejects.toThrow('socio-moroso');
    });

    test('lanza "socio-suspendido" cuando la respuesta es 403 con tipo suspendido', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { tipo: 'suspendido', socio: '1000' } }),
      });
      await expect(createEntrada(datos)).rejects.toThrow('socio-suspendido');
    });

    test('lanza el tipo del detalle cuando la respuesta es 409', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { tipo: 'sin_cupo' } }),
      });
      await expect(createEntrada(datos)).rejects.toThrow('sin_cupo');
    });

    test('lanza "conflicto" en 409 sin tipo reconocible', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) });
      await expect(createEntrada(datos)).rejects.toThrow('conflicto');
    });

    test('lanza error genérico en 400', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createEntrada(datos)).rejects.toThrow('Error al crear entrada');
    });
  });
});
