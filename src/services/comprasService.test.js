import { crearCompra } from './comprasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

describe('comprasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crearCompra', () => {
    const datos = { id_producto: 'producto-1', id_socio: 'socio-1', cantidad: 2 };

    test('hace POST al endpoint correcto con los datos de la compra', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'compra-1', estado: 'Iniciada' }),
      });

      await crearCompra(datos);

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/compras', 'POST', datos);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(crearCompra(datos)).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza el tipo del detalle cuando la respuesta es 409 con tipo sin_stock', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { tipo: 'sin_stock' } }),
      });
      await expect(crearCompra(datos)).rejects.toThrow('sin_stock');
    });

    test('lanza el tipo del detalle cuando la respuesta es 409 con tipo producto_inactivo', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: { tipo: 'producto_inactivo' } }),
      });
      await expect(crearCompra(datos)).rejects.toThrow('producto_inactivo');
    });

    test('lanza "moroso" cuando la respuesta es 403 con tipo moroso', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { tipo: 'moroso', socio: '1000' } }),
      });
      await expect(crearCompra(datos)).rejects.toThrow('moroso');
    });

    test('lanza "suspendido" cuando la respuesta es 403 con tipo suspendido', async () => {
      fetchTo.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: { tipo: 'suspendido', socio: '1000' } }),
      });
      await expect(crearCompra(datos)).rejects.toThrow('suspendido');
    });

    test('lanza error genérico cuando no hay tipo reconocible', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) });
      await expect(crearCompra(datos)).rejects.toThrow('Error al crear la compra');
    });
  });
});
