import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateNoticiaForm } from './CreateNoticiaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm() {
  return render(<CreateNoticiaForm onSuccess={onSuccess} onCancel={onCancel} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
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

  test('muestra pantalla de éxito y llama onSuccess con datos correctos', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Mi noticia' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Contenido' } });
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: 'https://img.com/foto.png' } });

    const dateInput = screen.getByDisplayValue('') || document.querySelector('input[type="date"]');
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('¡Noticia creada!')).toBeInTheDocument();
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith({
      titulo: 'Mi noticia',
      cuerpo: 'Contenido',
      fecha_expiracion: '2026-12-31',
      imagen: 'https://img.com/foto.png',
    });
  });

  test('imagen es null si el campo está vacío', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Título sin imagen' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Cuerpo' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));
    });

    await act(async () => { jest.advanceTimersByTime(1800); });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ imagen: null }));
  });

  test('muestra error y no submitea si la url de imagen usa http://', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/inauguración/i), { target: { value: 'Título' } });
    fireEvent.change(screen.getByPlaceholderText(/redactá el contenido/i), { target: { value: 'Cuerpo' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } });
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: 'http://img.com/foto.png' } });

    fireEvent.click(screen.getByRole('button', { name: /publicar noticia/i }));

    await waitFor(() => {
      expect(screen.getByText('La URL debe usar https://')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
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

  test('muestra los campos título, cuerpo, url de imagen y fecha de vencimiento', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/inauguración/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/redactá el contenido/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });
});
