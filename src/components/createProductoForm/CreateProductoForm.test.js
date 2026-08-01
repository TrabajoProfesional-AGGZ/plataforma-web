import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProductoForm } from './CreateProductoForm';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../services/productosService', () => ({
  subirImagenProducto: jest.fn(),
}));
import { subirImagenProducto } from '../../services/productosService';

const onSuccess = jest.fn();
const onCancel = jest.fn();

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Remera oficial del club');
  await userEvent.type(screen.getByLabelText('Descripción (opcional)'), 'Remera 100% algodón');
  await userEvent.type(screen.getByLabelText('Precio ($)'), '15000');
  await userEvent.type(screen.getByLabelText('Stock'), '25');
}

describe('CreateProductoForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza los campos del formulario', () => {
    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    expect(screen.getByText('Nuevo producto')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción (opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Precio ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock')).toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar', async () => {
    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('muestra errores de validación si se intenta enviar con campos vacíos', async () => {
    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(screen.getByText('El precio es requerido')).toBeInTheDocument();
      expect(screen.getByText('El stock es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra error si el precio es negativo', async () => {
    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    await userEvent.type(screen.getByLabelText('Precio ($)'), '-5');
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(screen.getByText('El precio no puede ser negativo')).toBeInTheDocument();
    });
  });

  test('crea el producto correctamente sin imagen y llama a onSuccess con el payload esperado', async () => {
    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(screen.getByText('¡Producto creado!')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalledWith({
          nombre: 'Remera oficial del club',
          descripcion: 'Remera 100% algodón',
          precio: 15000,
          stock: 25,
          imagen_url: null,
        });
      },
      { timeout: 3000 },
    );
    expect(subirImagenProducto).not.toHaveBeenCalled();
  });

  test('sube la imagen seleccionada y la incluye en el payload al enviar', async () => {
    subirImagenProducto.mockResolvedValueOnce({ url: 'https://cdn.club.com/producto.png' });

    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    await fillForm();

    const file = new File(['contenido'], 'producto.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Subir archivo desde la computadora');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Cambiar imagen')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(subirImagenProducto).toHaveBeenCalledWith(expect.stringContaining('data:'));
    });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ imagen_url: 'https://cdn.club.com/producto.png' }),
        );
      },
      { timeout: 3000 },
    );
  });

  test('muestra un error si falla la subida de la imagen y no envía el formulario', async () => {
    subirImagenProducto.mockRejectedValueOnce(new Error('upload-failed'));

    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);
    await fillForm();

    const file = new File(['contenido'], 'producto.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Subir archivo desde la computadora');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Cambiar imagen')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(screen.getByText('No se pudo subir la imagen. Intentá de nuevo.')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('descarta un archivo inválido y muestra el estado de error', async () => {
    render(<CreateProductoForm onSuccess={onSuccess} onCancel={onCancel} />);

    const file = new File(['contenido'], 'archivo.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Subir archivo desde la computadora');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });
});