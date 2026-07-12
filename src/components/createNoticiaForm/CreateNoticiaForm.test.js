import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateNoticiaForm } from './CreateNoticiaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../services/noticiasService', () => ({ subirImagenNoticia: jest.fn() }));
import { subirImagenNoticia } from '../../services/noticiasService';

const onSuccess = jest.fn();
const onCancel = jest.fn();

class MockFileReader {
  readAsDataURL(file) {
    this.result = `data:${file.type};base64,ZmFrZQ==`;
    if (this.onload) this.onload();
  }
}

function crearArchivo({ name = 'foto.jpg', type = 'image/jpeg', size } = {}) {
  const file = new File(['contenido-de-prueba'], name, { type });
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  return file;
}

function renderForm() {
  return render(<CreateNoticiaForm onSuccess={onSuccess} onCancel={onCancel} />);
}

function getFileInput() {
  return screen.getByLabelText('Subir archivo desde la computadora');
}

async function subirArchivo(file) {
  await act(async () => {
    fireEvent.change(getFileInput(), { target: { files: [file] } });
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  global.FileReader = MockFileReader;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateNoticiaForm', () => {
  test('renderiza el formulario con el título "Nueva noticia"', () => {
    renderForm();
    expect(screen.getByText('Nueva noticia')).toBeInTheDocument();
  });

  test('muestra el botón Cancelar', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  test('llama a onCancel al hacer clic en Cancelar', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al presionar ESC', () => {
    renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al hacer clic en el overlay', () => {
    renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('no envía si el título está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    await waitFor(() => {
      expect(screen.getByText('El título es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si el cuerpo está vacío', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Título' } });
    fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    await waitFor(() => {
      expect(screen.getByText('El cuerpo es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si la fecha de vencimiento está vacía', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Título' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Cuerpo' } });
    fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    await waitFor(() => {
      expect(screen.getByText('La fecha de vencimiento es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no sube la imagen al elegir el archivo, solo la previsualiza', async () => {
    renderForm();
    await subirArchivo(crearArchivo());

    expect(subirImagenNoticia).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /cambiar imagen/i })).toBeInTheDocument();
    expect(screen.getByText('Se subirá al publicar la noticia')).toBeInTheDocument();
  });

  test('no sube la imagen a Cloudinary si se cancela el formulario después de elegir una foto', async () => {
    renderForm();
    await subirArchivo(crearArchivo());

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(subirImagenNoticia).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('sube la imagen recién al publicar y llama onSuccess con la url subida a Cloudinary', async () => {
    subirImagenNoticia.mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/image/upload/v1/noticias/foto.jpg' });
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Mi noticia' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Contenido' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });

    await subirArchivo(crearArchivo());
    expect(subirImagenNoticia).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    });

    await waitFor(() => expect(subirImagenNoticia).toHaveBeenCalledWith('data:image/jpeg;base64,ZmFrZQ==', 'Mi noticia'));

    await waitFor(() => {
      expect(screen.getByText('¡Noticia creada!')).toBeInTheDocument();
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      titulo: 'Mi noticia',
      cuerpo: 'Contenido',
      fecha_expiracion: '2026-12-31',
      imagen: 'https://res.cloudinary.com/demo/image/upload/v1/noticias/foto.jpg',
    });
  });

  test('imagen es null si no se sube ningún archivo', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Título sin imagen' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Cuerpo' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ imagen: null }));
    expect(subirImagenNoticia).not.toHaveBeenCalled();
  });

  test('usa el título de la foto en vez del título de la noticia cuando se completa', async () => {
    subirImagenNoticia.mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/image/upload/v1/noticias/foto.jpg' });
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Mi noticia' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Contenido' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });
    fireEvent.change(screen.getByPlaceholderText(/si lo dejás vacío/i), { target: { value: 'Título de la foto' } });

    await subirArchivo(crearArchivo());
    expect(subirImagenNoticia).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    });

    await waitFor(() => expect(subirImagenNoticia).toHaveBeenCalledWith('data:image/jpeg;base64,ZmFrZQ==', 'Título de la foto'));
  });

  test('rechaza un archivo con tipo no permitido sin llamar al servicio', async () => {
    renderForm();
    fireEvent.change(getFileInput(), { target: { files: [crearArchivo({ name: 'foto.gif', type: 'image/gif' })] } });

    await waitFor(() => {
      expect(screen.getByText('Solo se permiten imágenes JPG, PNG o WEBP')).toBeInTheDocument();
    });
    expect(subirImagenNoticia).not.toHaveBeenCalled();
  });

  test('rechaza un archivo con doble extensión peligrosa sin llamar al servicio', async () => {
    renderForm();
    fireEvent.change(getFileInput(), {
      target: { files: [crearArchivo({ name: 'foto.exe.jpg', type: 'image/jpeg' })] },
    });

    await waitFor(() => {
      expect(screen.getByText('Nombre de archivo no permitido')).toBeInTheDocument();
    });
    expect(subirImagenNoticia).not.toHaveBeenCalled();
  });

  test('rechaza un archivo que supera los 5MB sin llamar al servicio', async () => {
    renderForm();
    fireEvent.change(getFileInput(), {
      target: { files: [crearArchivo({ size: 6 * 1024 * 1024 })] },
    });

    await waitFor(() => {
      expect(screen.getByText('La imagen no puede superar los 5MB')).toBeInTheDocument();
    });
    expect(subirImagenNoticia).not.toHaveBeenCalled();
  });

  test('muestra indicador de error y no publica si falla la subida al backend', async () => {
    subirImagenNoticia.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Mi noticia' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Contenido' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });
    await subirArchivo(crearArchivo());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('No se pudo subir la imagen. Intentá de nuevo.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText('¡Noticia creada!')).not.toBeInTheDocument();
  });

  test('muestra error y no submitea si el título excede el máximo de caracteres', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'a'.repeat(151) } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Cuerpo' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });

    fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));

    await waitFor(() => {
      expect(screen.getByText('Máximo 150 caracteres')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra los campos título, cuerpo, subir imagen, título de la foto y fecha de vencimiento', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/inauguración/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/redactá el contenido/i)).toBeInTheDocument();
    expect(screen.getByText('Subir archivo desde la computadora')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/si lo dejás vacío/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });
});
