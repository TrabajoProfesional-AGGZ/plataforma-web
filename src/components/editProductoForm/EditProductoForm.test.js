import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditProductoForm } from './EditProductoForm';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../services/productosService', () => ({
  subirImagenProducto: jest.fn(),
  editarProducto: jest.fn(),
}));
import { subirImagenProducto, editarProducto } from '../../services/productosService';

const PRODUCTO = {
  id: 'p-1',
  nombre: 'Remera oficial',
  descripcion: 'Remera de algodón',
  precio: 15000,
  stock: 25,
  activo: true,
  imagen_url: 'https://cdn.club.com/remera.png',
};

const onSuccess = jest.fn();
const onCancel = jest.fn();

describe('EditProductoForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario con los valores del producto precargados', () => {
    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByText('Editar producto')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Remera oficial');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Remera de algodón');
    expect(screen.getByLabelText('Precio ($)')).toHaveValue(15000);
    expect(screen.getByLabelText('Stock')).toHaveValue(25);
  });

  test('llama a onCancel al hacer click en Cancelar', async () => {
    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('muestra error de validación si se borra el nombre', async () => {
    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.clear(screen.getByLabelText('Nombre'));
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
    expect(editarProducto).not.toHaveBeenCalled();
  });

  test('muestra error si el stock es negativo', async () => {
    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.clear(screen.getByLabelText('Stock'));
    await userEvent.type(screen.getByLabelText('Stock'), '-3');
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText('No puede ser negativo')).toBeInTheDocument();
    });
  });

  test('guarda los cambios correctamente y llama a onSuccess', async () => {
    editarProducto.mockResolvedValueOnce({ ...PRODUCTO, nombre: 'Remera oficial actualizada' });

    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.clear(screen.getByLabelText('Nombre'));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Remera oficial actualizada');
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(editarProducto).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({ nombre: 'Remera oficial actualizada', precio: 15000, stock: 25 }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('¡Producto actualizado!')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ nombre: 'Remera oficial actualizada' }),
        );
      },
      { timeout: 3000 },
    );
  });

  test('sube una nueva imagen y la incluye en el payload al guardar', async () => {
    subirImagenProducto.mockResolvedValueOnce({ url: 'https://cdn.club.com/nueva.png' });
    editarProducto.mockResolvedValueOnce({ ...PRODUCTO, imagen_url: 'https://cdn.club.com/nueva.png' });

    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);

    const file = new File(['contenido'], 'nueva.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Subir archivo desde la computadora');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Cambiar imagen')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(subirImagenProducto).toHaveBeenCalledWith(expect.stringContaining('data:'));
    });

    await waitFor(() => {
      expect(editarProducto).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({ imagen_url: 'https://cdn.club.com/nueva.png' }),
      );
    });
  });

  test('si falla la actualización, no muestra éxito ni llama a onSuccess', async () => {
    editarProducto.mockRejectedValueOnce(new Error('servicio-no-disponible'));

    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(editarProducto).toHaveBeenCalled();
    });
    expect(screen.queryByText('¡Producto actualizado!')).not.toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('descarta un archivo inválido y muestra el estado de error', async () => {
    render(<EditProductoForm producto={PRODUCTO} onSuccess={onSuccess} onCancel={onCancel} />);

    const file = new File(['contenido'], 'archivo.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Subir archivo desde la computadora');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });
});