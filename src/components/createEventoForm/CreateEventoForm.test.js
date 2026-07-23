import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateEventoForm } from './CreateEventoForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));
jest.mock('../../services/eventosService', () => ({ subirImagenEvento: jest.fn() }));
import { subirImagenEvento } from '../../services/eventosService';

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
  return render(<CreateEventoForm onSuccess={onSuccess} onCancel={onCancel} />);
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

function completarCamposObligatorios({ nombre = 'Fiesta de fin de año', capacidad = '100', valor = '5000' } = {}) {
  fireEvent.change(screen.getByPlaceholderText(/fiesta de fin de año/i), { target: { value: nombre } });
  fireEvent.change(screen.getByPlaceholderText(/contale a los socios/i), { target: { value: 'Un evento de prueba' } });
  fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });
  const horas = document.querySelectorAll('input[type="time"]');
  fireEvent.change(horas[0], { target: { value: '20:00' } });
  fireEvent.change(horas[1], { target: { value: '23:00' } });
  fireEvent.change(screen.getByPlaceholderText(/ej\. 100/i), { target: { value: capacidad } });
  fireEvent.change(screen.getByPlaceholderText(/ej\. 5000/i), { target: { value: valor } });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  global.FileReader = MockFileReader;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateEventoForm', () => {
  test('renderiza el formulario con el título "Nuevo evento"', () => {
    renderForm();
    expect(screen.getByText('Nuevo evento')).toBeInTheDocument();
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

  test('no envía si el nombre está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si la descripción está vacía', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/fiesta de fin de año/i), { target: { value: 'Título' } });
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    await waitFor(() => {
      expect(screen.getByText('La descripción es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si falta la capacidad máxima', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/fiesta de fin de año/i), { target: { value: 'Título' } });
    fireEvent.change(screen.getByPlaceholderText(/contale a los socios/i), { target: { value: 'Desc' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });
    const horas = document.querySelectorAll('input[type="time"]');
    fireEvent.change(horas[0], { target: { value: '20:00' } });
    fireEvent.change(horas[1], { target: { value: '23:00' } });
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    await waitFor(() => {
      expect(screen.getByText('La capacidad es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no sube la imagen al elegir el archivo, solo la previsualiza', async () => {
    renderForm();
    await subirArchivo(crearArchivo());

    expect(subirImagenEvento).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /cambiar imagen/i })).toBeInTheDocument();
  });

  test('sube la imagen recién al crear y llama onSuccess con la url subida a Cloudinary', async () => {
    subirImagenEvento.mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/image/upload/v1/eventos/foto.jpg' });
    renderForm();
    completarCamposObligatorios();

    await subirArchivo(crearArchivo());
    expect(subirImagenEvento).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    });

    await waitFor(() => expect(subirImagenEvento).toHaveBeenCalledWith('data:image/jpeg;base64,ZmFrZQ==', 'Fiesta de fin de año'));

    await waitFor(() => {
      expect(screen.getByText('¡Evento creado!')).toBeInTheDocument();
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Fiesta de fin de año',
      descripcion: 'Un evento de prueba',
      dia: '2026-12-31',
      hora_inicio: '20:00:00',
      hora_fin: '23:00:00',
      capacidad_maxima: 100,
      valor_entrada: 5000,
      foto_url: 'https://res.cloudinary.com/demo/image/upload/v1/eventos/foto.jpg',
    });
  });

  test('foto_url es null si no se sube ningún archivo', async () => {
    renderForm();
    completarCamposObligatorios();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ foto_url: null }));
    expect(subirImagenEvento).not.toHaveBeenCalled();
  });

  test('rechaza un archivo con tipo no permitido sin llamar al servicio', async () => {
    renderForm();
    fireEvent.change(getFileInput(), { target: { files: [crearArchivo({ name: 'foto.gif', type: 'image/gif' })] } });

    await waitFor(() => {
      expect(screen.getByText('Solo se permiten imágenes JPG, PNG o WEBP')).toBeInTheDocument();
    });
    expect(subirImagenEvento).not.toHaveBeenCalled();
  });

  test('muestra indicador de error y no crea el evento si falla la subida al backend', async () => {
    subirImagenEvento.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    renderForm();
    completarCamposObligatorios();
    await subirArchivo(crearArchivo());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('No se pudo subir la imagen. Intentá de nuevo.')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText('¡Evento creado!')).not.toBeInTheDocument();
  });
});
