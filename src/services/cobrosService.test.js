import { getEstadoMercadoPago, getUrlAutorizacionMercadoPago } from './cobrosService';
import { fetchTo } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

function respuesta(status, cuerpo) {
  return { ok: status >= 200 && status < 300, status, json: async () => cuerpo };
}

describe('cobrosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEstadoMercadoPago', () => {
    test('no manda el club: sale del claim del token y lo propaga el gateway', async () => {
      fetchTo.mockResolvedValueOnce(respuesta(200, { conectado: true, estado: 'conectado' }));

      const estado = await getEstadoMercadoPago();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/pagos/oauth/estado', 'GET');
      expect(estado.conectado).toBe(true);
    });

    test('traduce el 403 a "sin-permiso", que se muestra distinto de una caída', async () => {
      fetchTo.mockResolvedValueOnce(respuesta(403, {}));
      await expect(getEstadoMercadoPago()).rejects.toThrow('sin-permiso');
    });

    test('traduce el 500 a "servicio-no-disponible"', async () => {
      fetchTo.mockResolvedValueOnce(respuesta(500, {}));
      await expect(getEstadoMercadoPago()).rejects.toThrow('servicio-no-disponible');
    });
  });

  describe('getUrlAutorizacionMercadoPago', () => {
    test('devuelve sólo la URL de autorización', async () => {
      fetchTo.mockResolvedValueOnce(
        respuesta(200, { url_autorizacion: 'https://auth.mercadopago.com/authorization?x=1' })
      );

      const url = await getUrlAutorizacionMercadoPago();

      expect(fetchTo).toHaveBeenCalledWith('/api/v1/pagos/oauth/autorizar', 'GET');
      expect(url).toBe('https://auth.mercadopago.com/authorization?x=1');
    });

    test('un 503 es falta de configuración del servidor, no una caída', async () => {
      fetchTo.mockResolvedValueOnce(respuesta(503, {}));
      await expect(getUrlAutorizacionMercadoPago()).rejects.toThrow('oauth-no-configurado');
    });

    test('traduce el 401 a "sin-permiso"', async () => {
      fetchTo.mockResolvedValueOnce(respuesta(401, {}));
      await expect(getUrlAutorizacionMercadoPago()).rejects.toThrow('sin-permiso');
    });
  });
});
