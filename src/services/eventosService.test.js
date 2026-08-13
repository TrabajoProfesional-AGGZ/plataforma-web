import { getEventos, getEventosHistoricos, subirImagenEvento, createEvento } from './eventosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

const EVENTO_MOCK = {
  id: 'e-1',
  nombre: 'Fiesta de fin de año',
  descripcion: 'Evento de prueba',
  dia: '2026-12-31',
  hora_inicio: '20:00:00',
  hora_fin: '23:00:00',
  capacidad_maxima: 100,
  entradas_vendidas: 0,
  valor_entrada: 5000,
  foto_url: null,
};

describe('eventosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventos', () => {
    test('llama al endpoint /api/v1/eventos con GET', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [EVENTO_MOCK] });
      const result = await getEventos();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/eventos', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getEventos()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getEventos()).rejects.toThrow('Error al obtener eventos');
    });
  });

  describe('getEventosHistoricos', () => {
    test('llama al endpoint /api/v1/eventos/historicos con GET', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [EVENTO_MOCK] });
      const result = await getEventosHistoricos();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/eventos/historicos', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getEventosHistoricos()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getEventosHistoricos()).rejects.toThrow('Error al obtener eventos históricos');
    });
  });

  describe('subirImagenEvento', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ url: 'https://res.cloudinary.com/x/evento.jpg' }) });
      const result = await subirImagenEvento('data:image/jpeg;base64,abc', 'Mi evento');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/eventos/imagen', 'POST', {
        imagen_base64: 'data:image/jpeg;base64,abc',
        titulo_foto: 'Mi evento',
      });
      expect(result.url).toBe('https://res.cloudinary.com/x/evento.jpg');
    });

    test('envía titulo_foto null cuando no se pasa título', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ url: 'https://res.cloudinary.com/x/evento.jpg' }) });
      await subirImagenEvento('data:image/jpeg;base64,abc');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/eventos/imagen', 'POST', {
        imagen_base64: 'data:image/jpeg;base64,abc',
        titulo_foto: null,
      });
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(subirImagenEvento('data:image/jpeg;base64,abc')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(subirImagenEvento('data:image/jpeg;base64,abc')).rejects.toThrow('Error al subir la imagen');
    });
  });

  describe('createEvento', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => EVENTO_MOCK });
      const data = {
        nombre: 'Fiesta de fin de año',
        descripcion: 'Evento de prueba',
        dia: '2026-12-31',
        hora_inicio: '20:00:00',
        hora_fin: '23:00:00',
        capacidad_maxima: 100,
        valor_entrada: 5000,
        foto_url: null,
      };
      const result = await createEvento(data);
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/eventos', 'POST', data);
      expect(result.nombre).toBe('Fiesta de fin de año');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createEvento({})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createEvento({})).rejects.toThrow('Error al crear evento');
    });
  });
});
