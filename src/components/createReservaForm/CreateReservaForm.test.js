import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateReservaForm } from './CreateReservaForm';

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (_, tag) => ({ children, animate, initial, exit, transition, variants, custom, whileHover, whileTap, ...props }) =>
        React.createElement(tag, props, children),
    }),
    AnimatePresence: ({ children }) => children,
  };
});

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm() {
  return render(<CreateReservaForm onSuccess={onSuccess} onCancel={onCancel} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateReservaForm', () => {
  test('renderiza el paso 1 con los campos de solicitante', () => {
    renderForm();
    expect(screen.getByText('Nueva reserva')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/partido de fútbol/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/juan garcía/i)).toBeInTheDocument();
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

  test('no avanza al paso 2 si el título está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('El título es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('no avanza al paso 2 si el nombre del solicitante está vacío', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Clase de yoga' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('El nombre del solicitante es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('avanza al paso 2 con datos válidos en el paso 1', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Entrenamiento' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Ana Pérez' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument();
    });
  });

  test('muestra el botón Atrás en el paso 2', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Clase' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Pedro' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument();
  });

  test('vuelve al paso 1 al hacer clic en Atrás', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Clase' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Pedro' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument());
  });

  test('no envía si la fecha está vacía', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Evento' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Alguien' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));
    fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    await waitFor(() => {
      expect(screen.getByText('La fecha es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si hora fin es anterior a hora inicio', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Taller' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Grupo B' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));

    const fechaInput = document.querySelector('input[type="date"]');
    const [horaIniInput, horaFinInput] = document.querySelectorAll('input[type="time"]');
    fireEvent.change(fechaInput, { target: { value: '2026-07-01' } });
    fireEvent.change(horaIniInput, { target: { value: '10:00' } });
    fireEvent.change(horaFinInput, { target: { value: '08:00' } });
    fireEvent.blur(horaFinInput);

    await waitFor(() => {
      expect(screen.getByText(/hora de fin debe ser posterior/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra error si hora fin es igual a hora inicio', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Reunión' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Secretaria' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());

    // Llenar los campos de tiempo usando los ids de los inputs
    const fechaInput = document.querySelector('#cr-fecha') || document.querySelector('input[type="date"]');
    const horaIniInput = document.querySelector('#cr-hora-ini') || document.querySelectorAll('input[type="time"]')[0];
    const horaFinInput = document.querySelector('#cr-hora-fin') || document.querySelectorAll('input[type="time"]')[1];

    fireEvent.change(fechaInput, { target: { value: '2026-07-01' } });
    fireEvent.change(horaIniInput, { target: { value: '10:00' } });
    fireEvent.change(horaFinInput, { target: { value: '09:00' } });
    fireEvent.blur(horaFinInput);

    fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    await waitFor(() => {
      expect(screen.getByText(/hora de fin debe ser posterior/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra pantalla de éxito y llama onSuccess al confirmar con datos válidos', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/partido de fútbol/i), { target: { value: 'Clase de pilates' } });
    fireEvent.change(screen.getByPlaceholderText(/juan garcía/i), { target: { value: 'Laura Gómez' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));

    const fechaInput = document.querySelector('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '10:00' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('¡Reserva registrada!')).toBeInTheDocument();
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('muestra los indicadores de pasos', () => {
    renderForm();
    expect(screen.getByText('Solicitante')).toBeInTheDocument();
    expect(screen.getByText('Horario')).toBeInTheDocument();
  });
});
