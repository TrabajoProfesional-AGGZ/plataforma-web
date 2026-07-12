import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateReservaForm } from './CreateReservaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

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
const SOCIO_TEST_2 = { id: 'socio-uuid-2', nro_socio: '5678', nombre: 'Maria', apellido: 'Perez' };

const onSuccess = jest.fn();
const onCancel = jest.fn();

function renderForm(instalaciones = INSTALACIONES_TEST) {
  return render(
    <CreateReservaForm onSuccess={onSuccess} onCancel={onCancel} instalaciones={instalaciones} />
  );
}

async function agregarSocioAlForm(nroSocio = '1234') {
  const input = screen.getByPlaceholderText(/ej\. 1234/i);
  fireEvent.change(input, { target: { value: nroSocio } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
  });
  await waitFor(() => expect(screen.getByText(new RegExp(`${nroSocio}`))).toBeInTheDocument());
}

async function avanzarAlPaso2() {
  await agregarSocioAlForm('1234');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-uuid-1' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  });
  await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
  act(() => jest.advanceTimersByTime(300));
}

async function llenarYEnviarPaso2(horaFin = '10:00') {
  renderForm();
  await avanzarAlPaso2();
  const fechaInput = document.querySelector('input[type="date"]');
  const timeInputs = document.querySelectorAll('input[type="time"]');
  fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
  fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
  fireEvent.change(timeInputs[1], { target: { value: horaFin } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
  });
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

  test('no avanza al paso 2 si no se agregó ningún socio', async () => {
    renderForm();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-uuid-1' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Debe agregar al menos un socio.')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('no avanza al paso 2 si no se seleccionó una instalación', async () => {
    renderForm();
    await agregarSocioAlForm('1234');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Debe seleccionar una instalación')).toBeInTheDocument();
    });
    expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument();
  });

  test('no agrega el socio si no es encontrado y muestra error', async () => {
    getSocioByNroSocio.mockRejectedValue(new Error('socio-no-encontrado'));
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '9999' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/no se encontró ningún socio con ese número/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/9999/)).not.toBeInTheDocument();
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
    await llenarYEnviarPaso2();
    await waitFor(() => {
      expect(screen.getByText('¡Reserva registrada!')).toBeInTheDocument();
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('llama a createReserva con la lista de IDs de socios', async () => {
    await llenarYEnviarPaso2('11:00');

    expect(createReserva).toHaveBeenCalledWith({
      ids_socios: ['socio-uuid-1'],
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

  test('muestra el spinner mientras busca el socio al agregar', async () => {
    let resolveSocio;
    getSocioByNroSocio.mockReturnValue(new Promise((resolve) => { resolveSocio = resolve; }));

    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));

    await waitFor(() => expect(screen.getByText('Buscando socio...')).toBeInTheDocument());

    await act(async () => { resolveSocio(SOCIO_TEST); });
    expect(screen.queryByText('Buscando socio...')).not.toBeInTheDocument();
  });

  test('los socios agregados permanecen visibles al volver al paso 1', async () => {
    renderForm();
    await avanzarAlPaso2();
    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument());
    expect(screen.getByText('1234 — García Juan')).toBeInTheDocument();
  });

  test('muestra error genérico si createReserva falla con error de red', async () => {
    createReserva.mockRejectedValue(new Error('error de red'));
    await llenarYEnviarPaso2();
    await waitFor(() => {
      expect(screen.getByText('No se pudo registrar la reserva. Intentá de nuevo.')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText('¡Reserva registrada!')).not.toBeInTheDocument();
  });

  test('muestra error de superposición cuando createReserva lanza "superposicion"', async () => {
    createReserva.mockRejectedValue(new Error('superposicion'));
    await llenarYEnviarPaso2();
    await waitFor(() => {
      expect(screen.getByText('Ya existe una reserva en ese horario para esta instalación.')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('el select de instalación aplica focus y blur', () => {
    renderForm();
    const select = screen.getByRole('combobox');
    fireEvent.focus(select);
    fireEvent.blur(select);
    expect(select).toBeInTheDocument();
  });

  test('hora_fin es válida si hora_inicio está vacía', async () => {
    renderForm();
    await avanzarAlPaso2();
    const [, horaFinInput] = document.querySelectorAll('input[type="time"]');
    fireEvent.change(horaFinInput, { target: { value: '10:00' } });
    fireEvent.blur(horaFinInput);
    await waitFor(() => {
      expect(screen.queryByText(/hora de fin debe ser posterior/i)).not.toBeInTheDocument();
    });
  });

  // ── Tests del preview inline al perder el foco ──

  test('al perder el foco con un nro válido, muestra el nombre del socio inline', async () => {
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '1234' } });
    await act(async () => { fireEvent.blur(input); });
    await waitFor(() => expect(screen.getByText('García Juan')).toBeInTheDocument());
  });

  test('al cambiar el campo después del preview, limpia el nombre del socio', async () => {
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '1234' } });
    await act(async () => { fireEvent.blur(input); });
    await waitFor(() => expect(screen.getByText('García Juan')).toBeInTheDocument());
    await act(async () => { fireEvent.change(input, { target: { value: '5678' } }); });
    await waitFor(() => expect(screen.queryByText('García Juan')).not.toBeInTheDocument());
  });

  test('al cambiar el campo después de un error de agregar, limpia el mensaje de error', async () => {
    getSocioByNroSocio.mockRejectedValueOnce(new Error('not found')).mockResolvedValue(SOCIO_TEST);
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '9999' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText(/no se encontró ningún socio/i)).toBeInTheDocument());
    await act(async () => { fireEvent.change(input, { target: { value: '1234' } }); });
    await waitFor(() => expect(screen.queryByText(/no se encontró ningún socio/i)).not.toBeInTheDocument());
  });

  test('agregar con preview cargado no llama de nuevo a la API', async () => {
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '1234' } });
    await act(async () => { fireEvent.blur(input); });
    await waitFor(() => expect(screen.getByText('García Juan')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText('1234 — García Juan')).toBeInTheDocument());

    expect(getSocioByNroSocio).toHaveBeenCalledTimes(1);
  });

  test('el preview falla silenciosamente sin mostrar error al usuario', async () => {
    getSocioByNroSocio.mockRejectedValue(new Error('not found'));
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '9999' } });
    await act(async () => { fireEvent.blur(input); });
    await waitFor(() => {});
    expect(screen.queryByText(/no se encontró ningún socio/i)).not.toBeInTheDocument();
  });

  test('perder el foco con el campo vacío no llama a getSocioByNroSocio', async () => {
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    await act(async () => { fireEvent.blur(input); });
    expect(getSocioByNroSocio).not.toHaveBeenCalled();
  });

  // ── Tests de multi-socio ──

  test('permite agregar múltiples socios y los muestra como chips', async () => {
    getSocioByNroSocio
      .mockResolvedValueOnce(SOCIO_TEST)
      .mockResolvedValueOnce(SOCIO_TEST_2);
    renderForm();
    await agregarSocioAlForm('1234');
    expect(screen.getByText('1234 — García Juan')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '5678' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText('5678 — Perez Maria')).toBeInTheDocument());
    expect(screen.getByText('1234 — García Juan')).toBeInTheDocument();
  });

  test('permite remover un socio de la lista', async () => {
    renderForm();
    await agregarSocioAlForm('1234');
    expect(screen.getByText('1234 — García Juan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /quitar socio 1234/i }));
    expect(screen.queryByText('1234 — García Juan')).not.toBeInTheDocument();
  });

  test('no permite agregar el mismo socio dos veces', async () => {
    getSocioByNroSocio.mockResolvedValue(SOCIO_TEST);
    renderForm();
    await agregarSocioAlForm('1234');
    expect(screen.getByText('1234 — García Juan')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText('Este socio ya fue agregado.')).toBeInTheDocument());
    expect(screen.getAllByText('1234 — García Juan').length).toBe(1);
  });

  test('envía los IDs de todos los socios agregados', async () => {
    getSocioByNroSocio
      .mockResolvedValueOnce(SOCIO_TEST)
      .mockResolvedValueOnce(SOCIO_TEST_2);
    renderForm();
    await agregarSocioAlForm('1234');
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '5678' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText('5678 — Perez Maria')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-uuid-1' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    });
    await waitFor(() => expect(screen.getByText(/paso 2 de 2/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(300));

    const fechaInput = document.querySelector('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '11:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    });

    await waitFor(() => expect(createReserva).toHaveBeenCalledWith({
      ids_socios: ['socio-uuid-1', 'socio-uuid-2'],
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2026-08-10',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    }));
  });

  test('agregar socio con Enter en el input funciona igual que el botón', async () => {
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '1234' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    await waitFor(() => expect(screen.getByText('1234 — García Juan')).toBeInTheDocument());
  });
});
