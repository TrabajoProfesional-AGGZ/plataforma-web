import { getNoticias, getNoticiasHistoricas, getNoticia, createNoticia, editarNoticia, borrarNoticia, subirImagenNoticia } from './noticiasService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

const NOTICIA_MOCK = {
  id: 'n-1',
  titulo: 'Test noticia',
  cuerpo: 'Cuerpo de prueba',
  fecha_publicacion: '2026-06-30',
  fecha_expiracion: '2026-07-30',
  estado: 'Publicada',
  imagen: null,
};

describe('noticiasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNoticias', () => {
    test('llama al endpoint /api/v1/noticias/vigentes con GET', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [NOTICIA_MOCK] });
      const result = await getNoticias();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias/vigentes', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getNoticias()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getNoticias()).rejects.toThrow('Error al obtener noticias');
    });
  });

  describe('getNoticiasHistoricas', () => {
    test('llama al endpoint /api/v1/noticias con GET', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [NOTICIA_MOCK] });
      const result = await getNoticiasHistoricas();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getNoticiasHistoricas()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(getNoticiasHistoricas()).rejects.toThrow('Error al obtener noticias históricas');
    });
  });

  describe('getNoticia', () => {
    test('llama al endpoint correcto con el id', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => NOTICIA_MOCK });
      const result = await getNoticia('n-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias/n-1', 'GET');
      expect(result.titulo).toBe('Test noticia');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getNoticia('n-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getNoticia('n-1')).rejects.toThrow('Error al obtener la noticia');
    });
  });

  describe('createNoticia', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => NOTICIA_MOCK });
      const data = { titulo: 'Test', cuerpo: 'Cuerpo', fecha_expiracion: '2026-07-30' };
      const result = await createNoticia(data);
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias', 'POST', data);
      expect(result.titulo).toBe('Test noticia');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createNoticia({})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createNoticia({})).rejects.toThrow('Error al crear noticia');
    });
  });

  describe('editarNoticia', () => {
    test('llama al endpoint correcto con PATCH y el body', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => NOTICIA_MOCK });
      const result = await editarNoticia('n-1', { titulo: 'Nuevo título' });
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias/n-1', 'PATCH', { titulo: 'Nuevo título' });
      expect(result).toBeDefined();
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(editarNoticia('n-1', {})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(editarNoticia('n-1', {})).rejects.toThrow('Error al editar noticia');
    });
  });

  describe('subirImagenNoticia', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ url: 'https://res.cloudinary.com/x/foto.jpg' }) });
      const result = await subirImagenNoticia('data:image/jpeg;base64,abc', 'Mi título');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias/imagen', 'POST', {
        imagen_base64: 'data:image/jpeg;base64,abc',
        titulo_foto: 'Mi título',
      });
      expect(result.url).toBe('https://res.cloudinary.com/x/foto.jpg');
    });

    test('envía titulo_foto null cuando no se pasa título', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ url: 'https://res.cloudinary.com/x/foto.jpg' }) });
      await subirImagenNoticia('data:image/jpeg;base64,abc');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias/imagen', 'POST', {
        imagen_base64: 'data:image/jpeg;base64,abc',
        titulo_foto: null,
      });
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(subirImagenNoticia('data:image/jpeg;base64,abc')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(subirImagenNoticia('data:image/jpeg;base64,abc')).rejects.toThrow('Error al subir la imagen');
    });
  });

  describe('borrarNoticia', () => {
    test('llama al endpoint correcto con DELETE', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 204 });
      await borrarNoticia('n-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/noticias/n-1', 'DELETE');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(borrarNoticia('n-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(borrarNoticia('n-1')).rejects.toThrow('Error al borrar noticia');
    });
  });
});
