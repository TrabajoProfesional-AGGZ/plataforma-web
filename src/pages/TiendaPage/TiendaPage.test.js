import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TiendaPage from './TiendaPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/productosService', () => ({
  getProductos: jest.fn(),
  getProducto: jest.fn(),
  createProducto: jest.fn(),
  editarProducto: jest.fn(),
  subirImagenProducto: jest.fn(),
}));
import { getProductos, getProducto, createProducto } from '../../services/productosService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../components/createProductoForm/CreateProductoForm', () => ({
  CreateProductoForm: ({ onSuccess, onCancel }) => (
    <div>
      <h2>Nuevo producto</h2>
      <button onClick={() => onSuccess({ nombre: 'Pelota de fútbol', precio: 5000, stock: 10, activo: true })}>
        Confirmar creación
      </button>
      <button onClick={onCancel}>Cancelar creación</button>
    </div>
  ),
}));

jest.mock('../../components/editProductoForm/EditProductoForm', () => ({
  EditProductoForm: ({ producto, onSuccess, onCancel }) => (
    <div>
      <h2>Editar producto</h2>
      <span>{producto.nombre}</span>
      <button onClick={() => onSuccess({ ...producto, nombre: 'Remera edición limitada' })}>
        Confirmar edición
      </button>
      <button onClick={onCancel}>Cancelar edición</button>
    </div>
  ),
}));

const PRODUCTOS = [
  { id: 'p-1', nombre: 'Remera oficial', precio: 15000, stock: 25, activo: true, imagen_url: null },
  { id: 'p-2', nombre: 'Gorra del club', precio: 8000, stock: 0, activo: false, imagen_url: null },
];

async function renderPage() {
  render(<MemoryRouter><TiendaPage /></MemoryRouter>);
  await waitFor(() =>
    expect(document.querySelector('.list-loading')).not.toBeInTheDocument()
  );
}

describe('TiendaPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('muestra la lista de productos', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    await renderPage();
    expect(screen.getByText('Remera oficial')).toBeInTheDocument();
    expect(screen.getByText('Gorra del club')).toBeInTheDocument();
  });

  test('muestra el mensaje genérico cuando falla la carga por un error distinto', async () => {
    getProductos.mockRejectedValue(new Error('otro-error'));
    await renderPage();
    expect(screen.getByText('No se pudieron cargar los productos.')).toBeInTheDocument();
  });

  test('muestra la miniatura del producto cuando tiene imagen', async () => {
    getProductos.mockResolvedValue([
      { ...PRODUCTOS[0], imagen_url: 'https://cdn.example.com/remera-thumb.jpg' },
    ]);
    await renderPage();
    expect(document.querySelector('.tienda-thumb')).toHaveAttribute(
      'src',
      'https://cdn.example.com/remera-thumb.jpg'
    );
  });

  test('muestra estado vacío cuando no hay productos', async () => {
    getProductos.mockResolvedValue([]);
    await renderPage();
    expect(screen.getByText('No hay productos registrados.')).toBeInTheDocument();
  });

  test('muestra error cuando falla la carga', async () => {
    getProductos.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderPage();
    expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
  });

  test('click en un producto abre el detalle', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue({
      ...PRODUCTOS[0], descripcion: 'Remera algodón premium',
    });
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Remera oficial'));
    });
    await waitFor(() => {
      expect(screen.getByText('Remera algodón premium')).toBeInTheDocument();
    });
  });

  test('botón Nuevo producto abre el formulario de creación', async () => {
    getProductos.mockResolvedValue([]);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    expect(screen.getByRole('heading', { name: 'Nuevo producto' })).toBeInTheDocument();
  });

  test('muestra error cuando falla la carga del detalle', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Remera oficial'));
    });
    await waitFor(() => {
      expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
    });
  });

  test('permite abrir el detalle con el teclado', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue(PRODUCTOS[0]);
    await renderPage();
    const fila = screen.getByRole('button', { name: 'Ver detalle de Remera oficial' });
    await act(async () => {
      fireEvent.keyDown(fila, { key: 'Enter' });
    });
    await waitFor(() => {
      expect(screen.getByText('Volver a la tienda')).toBeInTheDocument();
    });
  });

  test('el botón Volver a la tienda regresa al listado', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue(PRODUCTOS[0]);
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Remera oficial'));
    });
    await waitFor(() => screen.getByText('Volver a la tienda'));
    fireEvent.click(screen.getByText('Volver a la tienda'));
    expect(screen.getByText('Tienda')).toBeInTheDocument();
    expect(screen.queryByText('Volver a la tienda')).not.toBeInTheDocument();
  });

  test('crea un producto y lo agrega a la lista', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    createProducto.mockResolvedValue({ id: 'p-3', nombre: 'Pelota de fútbol', precio: 5000, stock: 10, activo: true });
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    fireEvent.click(screen.getByText('Confirmar creación'));
    await waitFor(() => {
      expect(createProducto).toHaveBeenCalledWith({ nombre: 'Pelota de fútbol', precio: 5000, stock: 10, activo: true });
    });
    await waitFor(() => {
      expect(screen.getByText('Pelota de fútbol')).toBeInTheDocument();
    });
  });

  test('muestra error si falla la creación del producto', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    createProducto.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    fireEvent.click(screen.getByText('Confirmar creación'));
    await waitFor(() => {
      expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Pelota de fútbol')).not.toBeInTheDocument();
  });

  test('cancelar la creación cierra el formulario sin crear el producto', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    fireEvent.click(screen.getByText('Cancelar creación'));
    expect(screen.queryByRole('heading', { name: 'Nuevo producto' })).not.toBeInTheDocument();
    expect(createProducto).not.toHaveBeenCalled();
  });

  test('edita un producto y actualiza el detalle', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue(PRODUCTOS[0]);
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Remera oficial'));
    });
    await waitFor(() => screen.getByText('Editar producto'));
    fireEvent.click(screen.getByText('Editar producto'));
    fireEvent.click(screen.getByText('Confirmar edición'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Remera edición limitada' })).toBeInTheDocument();
    });
    expect(screen.queryByText('Confirmar edición')).not.toBeInTheDocument();
  });

  test('el detalle muestra la foto del producto cuando tiene una URL válida', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue({ ...PRODUCTOS[0], imagen_url: 'https://cdn.example.com/remera.jpg' });
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Remera oficial'));
    });
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Remera oficial' })).toHaveAttribute(
        'src',
        'https://cdn.example.com/remera.jpg'
      );
    });
  });

  test('el detalle muestra "Sin stock disponible" cuando el stock es 0', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue(PRODUCTOS[1]);
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Gorra del club'));
    });
    await waitFor(() => {
      expect(screen.getByText('Sin stock disponible')).toBeInTheDocument();
    });
  });

  test('cancelar la edición cierra el formulario sin modificar el detalle', async () => {
    getProductos.mockResolvedValue(PRODUCTOS);
    getProducto.mockResolvedValue(PRODUCTOS[0]);
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByText('Remera oficial'));
    });
    await waitFor(() => screen.getByText('Editar producto'));
    fireEvent.click(screen.getByText('Editar producto'));
    fireEvent.click(screen.getByText('Cancelar edición'));
    expect(screen.queryByText('Confirmar edición')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Remera oficial' })).toBeInTheDocument();
  });
});