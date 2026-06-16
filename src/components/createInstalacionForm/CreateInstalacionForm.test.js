import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateInstalacionForm } from './CreateInstalacionForm';

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
  return render(<CreateInstalacionForm onSuccess={onSuccess} onCancel={onCancel} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateInstalacionForm', () => {
  test('renderiza el paso 1 con el campo nombre', () => {
    renderForm();
    expect(screen.getByText('Nueva instalación')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/cancha de fútbol/i)).toBeInTheDocument();
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

  test('avanza al paso 2 con nombre válido', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Pileta' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/ej\. 50/i)).toBeInTheDocument();
  });

  test('muestra el botón Atrás en el paso 2', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Cancha' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument();
  });

  test('vuelve al paso 1 al hacer clic en Atrás', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Cancha' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument());
  });

  test('no envía el formulario si la capacidad está vacía', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Cancha' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));
    fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    await waitFor(() => {
      expect(screen.getByText('La capacidad es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si la capacidad es 0', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Cancha' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    await waitFor(() => {
      expect(screen.getByText(/debe ser mayor a 0/i)).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra pantalla de éxito y llama onSuccess con los datos tras confirmar', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Gimnasio' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '30' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('¡Instalación creada!')).toBeInTheDocument();
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledWith({
      nombre: 'Gimnasio',
      capacidad_maxima: 30,
      requiere_pago_extra: false,
    });
  });

  test('el checkbox de pago extra se puede activar', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'SUM' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('onSuccess recibe requiere_pago_extra: true si se marcó el checkbox', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/cancha de fútbol/i), { target: { value: 'Cancha VIP' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));
    fireEvent.change(screen.getByPlaceholderText(/ej\. 50/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /crear instalación/i }));
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ requiere_pago_extra: true }));
  });

  test('muestra indicadores de pasos correctamente', async () => {
    renderForm();
    expect(screen.getByText('Datos')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });
});
