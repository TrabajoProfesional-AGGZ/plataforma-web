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
import { getProductos, getProducto } from '../../services/productosService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

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
    expect(screen.getByPlaceholderText('Ej. Remera oficial del club')).toBeInTheDocument();
  });
});