import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateInstalacionForm } from './CreateInstalacionForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm() {
  return render(<CreateInstalacionForm onSuccess={onSuccess} onCancel={onCancel} />);
}

async function avanzarAlPaso2() {
  fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Pileta' } });
  fireEvent.change(screen.getByPlaceholderText(/deportiva, social, recreativa/i), { target: { value: 'Acuática' } });
  fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
  act(() => jest.advanceTimersByTime(300));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateInstalacionForm', () => {
  test('renderiza el paso 1 con los campos nombre y tipo', () => {
    renderForm();
    expect(screen.getByText('Nueva instalación')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/cancha de fútbol/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/deportiva, social, recreativa/i)).toBeInTheDocument();
  });

  test('muestra el botón Cancelar en el paso 1', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  test('llama onCancel al hacer clic en Cancelar', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama onCancel al presionar ESC', () => {
    renderForm();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama onCancel al hacer clic en el overlay', () => {
    renderForm();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('no avanza al paso 2 si el nombre está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('no avanza al paso 2 si el tipo está vacío', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Cancha' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('El tipo es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('avanza al paso 2 con nombre y tipo válidos', async () => {
    renderForm();
    await avanzarAlPaso2();
    expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ej\. 50/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ej\. 1500/i)).toBeInTheDocument();
  });

  test('muestra el botón Atrás en el paso 2', async () => {
    renderForm();
    await avanzarAlPaso2();
    expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument();
  });

  test('vuelve al paso 1 al hacer clic en Atrás', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument());
  });

  test('no envía el formulario si la capacidad está vacía', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    await waitFor(() => {
      expect(screen.getByText('La capacidad es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si la capacidad es 0', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    await waitFor(() => {
      expect(screen.getByText(/debe ser mayor a 0/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si el valor por hora es negativo', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '20' } });
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1500/i), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    await waitFor(() => {
      expect(screen.getByText(/no puede ser negativo/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra pantalla de éxito y llama onSuccess con los datos correctos', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '30' } });
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1500/i), { target: { value: '2000' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('¡Instalación creada!')).toBeInTheDocument();
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Pileta',
      tipo: 'Acuática',
      capacidad_maxima: 30,
      valor_hora: 2000,
      activa: true,
    });
  });

  test('el checkbox activa comienza marcado por defecto', async () => {
    renderForm();
    await avanzarAlPaso2();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('el checkbox activa se puede desmarcar', async () => {
    renderForm();
    await avanzarAlPaso2();
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('onSuccess recibe activa: false si se desmarcó el checkbox', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1500/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ activa: false }));
  });

  test('muestra indicadores de pasos correctamente', () => {
    renderForm();
    expect(screen.getByText('Datos')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  test('los inputs del paso 1 manejan focus y blur', () => {
    renderForm();
    const nombreInput = screen.getByPlaceholderText(/cancha de fútbol/i);
    fireEvent.focus(nombreInput);
    fireEvent.blur(nombreInput);
    const tipoInput = screen.getByPlaceholderText(/deportiva, social, recreativa/i);
    fireEvent.focus(tipoInput);
    fireEvent.blur(tipoInput);
    expect(nombreInput).toBeInTheDocument();
  });

  test('los inputs del paso 2 manejan focus y blur', async () => {
    renderForm();
    await avanzarAlPaso2();
    const capacidadInput = screen.getByPlaceholderText(/ej\. 50/i);
    fireEvent.focus(capacidadInput);
    fireEvent.blur(capacidadInput);
    const valorInput = screen.getByPlaceholderText(/ej\. 1500/i);
    fireEvent.focus(valorInput);
    fireEvent.blur(valorInput);
    expect(capacidadInput).toBeInTheDocument();
  });
});
