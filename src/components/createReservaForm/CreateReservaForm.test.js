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
jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');

jest.mock('../../services/reservasService', () => ({
  createReserva: jest.fn(),
}));
import { createReserva } from '../../services/reservasService';

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));
import { getSocioByNroSocio } from '../../services/sociosService';

const INSTALACIONES_TEST = [
  { id: 'inst-uuid-1', nombre: 'Cancha de fútbol' },
  { id: 'inst-uuid-2', nombre: 'Pileta' },
];

const SOCIO_TEST = { id: 'socio-uuid-1', nro_socio: '1234', nombre: 'Juan', apellido: 'García' };

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm(instalaciones = INSTALACIONES_TEST) {
  return render(
    <CreateReservaForm onSuccess={onSuccess} onCancel={onCancel} instalaciones={instalaciones} />
  );
}

async function avanzarAlPaso2() {
  fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-uuid-1' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  });
  await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
  act(() => jest.advanceTimersByTime(300));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  createReserva.mockResolvedValue({ id: 'reserva-nueva' });
  getSocioByNroSocio.mockResolvedValue(SOCIO_TEST);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CreateReservaForm', () => {
  test('renderiza el paso 1 con los campos de número de socio e instalación', () => {
    renderForm();
    expect(screen.getByText('Nueva reserva')).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ej\. 1234/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('muestra las instalaciones en el select con sus nombres', () => {
    renderForm();
    expect(screen.getByRole('option', { name: 'Cancha de fútbol' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pileta' })).toBeInTheDocument();
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

  test('no avanza al paso 2 si el número de socio está vacío', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('El número de socio es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('no avanza al paso 2 si no se seleccionó una instalación', async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText('Debe seleccionar una instalación')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('no avanza al paso 2 si el socio no es encontrado', async () => {
    getSocioByNroSocio.mockRejectedValue(new Error('socio-no-encontrado'));
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '9999' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-uuid-1' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/no se encontró ningún socio con ese número/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('avanza al paso 2 con datos válidos en el paso 1', async () => {
    renderForm();
    await avanzarAlPaso2();
    expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument();
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

  test('no envía si la fecha está vacía', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    await waitFor(() => {
      expect(screen.getByText('La fecha es requerida')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('no envía si hora fin es anterior a hora inicio', async () => {
    renderForm();
    await avanzarAlPaso2();

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

  test('muestra pantalla de éxito y llama onSuccess al confirmar con datos válidos', async () => {
    renderForm();
    await avanzarAlPaso2();

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

  test('llama a createReserva con el UUID del socio (no con el nro_socio)', async () => {
    renderForm();
    await avanzarAlPaso2();

    const fechaInput = document.querySelector('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '11:00' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    });

    expect(createReserva).toHaveBeenCalledWith({
      id_socio: 'socio-uuid-1',
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2026-08-10',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    });
  });

  test('muestra los indicadores de pasos', () => {
    renderForm();
    expect(screen.getByText('Datos')).toBeInTheDocument();
    expect(screen.getByText('Horario')).toBeInTheDocument();
  });

  test('funciona con lista de instalaciones vacía', () => {
    renderForm([]);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Cancha de fútbol' })).not.toBeInTheDocument();
  });
});
