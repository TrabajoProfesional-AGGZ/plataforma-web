import { getProductos, getProducto, subirImagenProducto, createProducto, editarProducto } from './productosService';

jest.mock('../utils/utils', () => ({ fetchTo: jest.fn() }));
import { fetchTo } from '../utils/utils';

const PRODUCTO_MOCK = {
  id: 'p-1',
  nombre: 'Remera oficial',
  descripcion: 'Remera del club talle M',
  precio: 15000,
  stock: 25,
  imagen_url: 'https://res.cloudinary.com/x/producto.jpg',
  activo: true,
};

describe('productosService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('getProductos', () => {
    test('llama al endpoint /api/v1/productos con GET', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [PRODUCTO_MOCK] });
      const result = await getProductos();
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/productos', 'GET');
      expect(result).toHaveLength(1);
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getProductos()).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando la respuesta no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getProductos()).rejects.toThrow('Error al obtener productos');
    });
  });

  describe('getProducto', () => {
    test('llama al endpoint correcto con el id', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => PRODUCTO_MOCK });
      const result = await getProducto('p-1');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/productos/p-1', 'GET');
      expect(result.nombre).toBe('Remera oficial');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getProducto('p-1')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getProducto('p-1')).rejects.toThrow('Error al obtener el producto');
    });
  });

  describe('subirImagenProducto', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ url: 'https://res.cloudinary.com/x/foto.jpg' }) });
      const result = await subirImagenProducto('data:image/jpeg;base64,abc');
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/productos/imagen', 'POST', {
        imagen_base64: 'data:image/jpeg;base64,abc',
      });
      expect(result.url).toBe('https://res.cloudinary.com/x/foto.jpg');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(subirImagenProducto('data:image/jpeg;base64,abc')).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(subirImagenProducto('data:image/jpeg;base64,abc')).rejects.toThrow('Error al subir la imagen');
    });
  });

  describe('createProducto', () => {
    test('llama al endpoint con POST y el body correcto', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 201, json: async () => PRODUCTO_MOCK });
      const data = { nombre: 'Remera', precio: 15000, stock: 25 };
      const result = await createProducto(data);
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/productos', 'POST', data);
      expect(result.nombre).toBe('Remera oficial');
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(createProducto({})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(createProducto({})).rejects.toThrow('Error al crear producto');
    });
  });

  describe('editarProducto', () => {
    test('llama al endpoint correcto con PATCH y el body', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => PRODUCTO_MOCK });
      const result = await editarProducto('p-1', { nombre: 'Remera v2' });
      expect(fetchTo).toHaveBeenCalledWith('/api/v1/productos/p-1', 'PATCH', { nombre: 'Remera v2' });
      expect(result).toBeDefined();
    });

    test('lanza servicio-no-disponible en 500', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(editarProducto('p-1', {})).rejects.toThrow('servicio-no-disponible');
    });

    test('lanza error genérico cuando no es ok', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(editarProducto('p-1', {})).rejects.toThrow('Error al editar producto');
    });
  });
});