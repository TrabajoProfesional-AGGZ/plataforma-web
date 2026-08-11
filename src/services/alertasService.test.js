import { getAlertas, createAlerta, borrarAlerta } from './alertasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

const ALERTA_MOCK = {
  id: 'a-1',
  mensaje: 'Recordatorio de vencimiento',
  filtro_categoria: null,
  filtro_estado: null,
  cantidad_destinatarios: 5,
  creado_en: '2026-07-01T00:00:00Z',
};

describe('alertasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlertas', () => {
    test('llama al endpoint /api/v1/alertas con GET', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [ALERTA_MOCK] });
      const result = await getAlertas();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/alertas', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getAlertas()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getAlertas()).rejects.toThrow('Error al obtener alertas');
    });
  });

  describe('createAlerta', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ALERTA_MOCK });
      const data = { mensaje: 'Test', filtro_categoria: null, filtro_estado: null };
      const result = await createAlerta(data);
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/alertas', 'POST', data);
      expect(result.mensaje).toBe('Recordatorio de vencimiento');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createAlerta({})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createAlerta({})).rejects.toThrow('Error al crear alerta');
    });
  });

  describe('borrarAlerta', () => {
    test('llama al endpoint correcto con DELETE', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 204 });
      await borrarAlerta('a-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/alertas/a-1', 'DELETE');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(borrarAlerta('a-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(borrarAlerta('a-1')).rejects.toThrow('Error al borrar alerta');
    });

    test('escapa el id en la URL para evitar manipulación de la ruta', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 204 });
      await borrarAlerta('a/1?#2');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/alertas/a%2F1%3F%232', 'DELETE');
    });
  });
});
