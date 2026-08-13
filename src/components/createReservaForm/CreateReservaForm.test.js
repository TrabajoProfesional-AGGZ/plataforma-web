import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateReservaForm } from './CreateReservaForm';

jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../services/reservasService', () => ({
  createReserva: jest.fn(),
  getTurnosDisponibles: jest.fn(),
}));
import { createReserva, getTurnosDisponibles } from '../../services/reservasService';

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));
import { getSocioByNroSocio } from '../../services/sociosService';

const INSTALACIONES_TEST = [
  { id: 'inst-uuid-1', nombre: 'Cancha de fútbol', capacidad_maxima: 6 },
  { id: 'inst-uuid-2', nombre: 'Pileta', capacidad_maxima: 10 },
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

async function llenarYEnviarPaso2(turno = '09:00:00') {
  renderForm();
  await avanzarAlPaso2();
  const fechaInput = document.querySelector('input[type="date"]');
  await act(async () => {
    fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
  });
  await waitFor(() => expect(screen.getByRole('option', { name: new RegExp(`^${turno.slice(0, 5)} `) })).toBeInTheDocument());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: turno } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  createReserva.mockResolvedValue({ id: 'reserva-nueva' });
  getSocioByNroSocio.mockResolvedValue(SOCIO_TEST);
  getTurnosDisponibles.mockResolvedValue([
    { hora_inicio: '09:00:00', cupos_disponibles: 6 },
    { hora_inicio: '10:00:00', cupos_disponibles: 3 },
    { hora_inicio: '11:00:00', cupos_disponibles: 6 },
  ]);
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

  test('muestra pantalla de éxito y llama onSuccess al confirmar con datos válidos', async () => {
    await llenarYEnviarPaso2();
    await waitFor(() => {
      expect(screen.getByText('¡Reserva registrada!')).toBeInTheDocument();
    });
    act(() => jest.advanceTimersByTime(1800));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test('llama a createReserva con la lista de IDs de socios', async () => {
    await llenarYEnviarPaso2('11:00:00');

    expect(createReserva).toHaveBeenCalledWith({
      ids_socios: ['socio-uuid-1'],
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2026-08-10',
      hora_inicio: '11:00:00',
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

  test('muestra error de cupo cuando createReserva lanza "sin-cupo"', async () => {
    const error = new Error('sin-cupo');
    error.cuposDisponibles = 1;
    createReserva.mockRejectedValue(error);
    await llenarYEnviarPaso2();
    await waitFor(() => {
      expect(screen.getByText('Ya no quedan cupos suficientes para ese turno con la cantidad de socios elegida.')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('muestra error de conflicto temporal cuando createReserva lanza "conflicto-temporal"', async () => {
    createReserva.mockRejectedValue(new Error('conflicto-temporal'));
    await llenarYEnviarPaso2();
    await waitFor(() => {
      expect(screen.getByText('La instalación está siendo actualizada por otra reserva. Probá de nuevo en unos segundos.')).toBeInTheDocument();
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
    await act(async () => {
      fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    });
    await waitFor(() => expect(screen.getByRole('option', { name: /^11:00 / })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '11:00:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));
    });

    await waitFor(() => expect(createReserva).toHaveBeenCalledWith({
      ids_socios: ['socio-uuid-1', 'socio-uuid-2'],
      id_instalacion: 'inst-uuid-1',
      fecha_reserva: '2026-08-10',
      hora_inicio: '11:00:00',
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

  // ── Tests de bloqueo por estado financiero del socio ──

  test('no permite agregar un socio moroso y muestra el aviso correspondiente', async () => {
    getSocioByNroSocio.mockResolvedValue({ ...SOCIO_TEST, estado: { nombre: 'Moroso' } });
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/regularice su situación financiera/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('1234 — García Juan')).not.toBeInTheDocument();
  });

  test('no permite agregar un socio suspendido y muestra el aviso correspondiente', async () => {
    getSocioByNroSocio.mockResolvedValue({ ...SOCIO_TEST, estado: { nombre: 'Suspendido' } });
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/termine su suspensión/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('1234 — García Juan')).not.toBeInTheDocument();
  });

  test('bloquea también al agregar por preview (blur) si el socio está moroso', async () => {
    getSocioByNroSocio.mockResolvedValue({ ...SOCIO_TEST, estado: { nombre: 'Moroso' } });
    renderForm();
    const input = screen.getByPlaceholderText(/ej\. 1234/i);
    fireEvent.change(input, { target: { value: '1234' } });
    await act(async () => { fireEvent.blur(input); });
    await waitFor(() => expect(screen.getByText('García Juan')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/regularice su situación financiera/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('1234 — García Juan')).not.toBeInTheDocument();
  });

  // ── Tests del selector de turnos disponibles ──

  test('muestra "Cargando turnos..." mientras se obtienen los turnos disponibles', async () => {
    let resolveTurnos;
    getTurnosDisponibles.mockReturnValue(new Promise((resolve) => { resolveTurnos = resolve; }));
    renderForm();
    await avanzarAlPaso2();

    const fechaInput = document.querySelector('input[type="date"]');
    fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });

    await waitFor(() => expect(screen.getByText('Cargando turnos...')).toBeInTheDocument());
    await act(async () => { resolveTurnos([{ hora_inicio: '09:00:00', cupos_disponibles: 6 }]); });
    expect(screen.queryByText('Cargando turnos...')).not.toBeInTheDocument();
  });

  test('muestra los turnos disponibles con sus cupos como opciones del select', async () => {
    renderForm();
    await avanzarAlPaso2();

    const fechaInput = document.querySelector('input[type="date"]');
    fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '09:00 (6/6 lugares)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '10:00 (3/6 lugares)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '11:00 (6/6 lugares)' })).toBeInTheDocument();
    });
  });

  test('muestra un aviso cuando no hay turnos disponibles para la fecha elegida', async () => {
    getTurnosDisponibles.mockResolvedValue([]);
    renderForm();
    await avanzarAlPaso2();

    const fechaInput = document.querySelector('input[type="date"]');
    await act(async () => {
      fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/no hay turnos disponibles/i)).toBeInTheDocument();
    });
  });

  test('en el paso 1, deshabilita "Agregar" y muestra aviso al llegar al cupo del turno ya elegido', async () => {
    const SOCIO_TEST_3 = { id: 'socio-uuid-3', nro_socio: '9012', nombre: 'Lucas', apellido: 'Diaz' };
    getSocioByNroSocio
      .mockResolvedValueOnce(SOCIO_TEST)
      .mockResolvedValueOnce(SOCIO_TEST_2)
      .mockResolvedValueOnce(SOCIO_TEST_3);

    renderForm();
    await avanzarAlPaso2(); // agrega el socio 1234 y llega al paso 2

    const fechaInput = document.querySelector('input[type="date"]');
    await act(async () => {
      fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    });
    // Turno 10:00 tiene cupo=3 (ver mock de getTurnosDisponibles en beforeEach)
    await waitFor(() => expect(screen.getByRole('option', { name: '10:00 (3/6 lugares)' })).toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '10:00:00' } });

    fireEvent.click(screen.getByRole('button', { name: /atrás/i }));
    await waitFor(() => expect(screen.getByText(/paso 1 de 2/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '5678' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText('5678 — Perez Maria')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '9012' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    });
    await waitFor(() => expect(screen.getByText('9012 — Diaz Lucas')).toBeInTheDocument());

    // Con 3 socios agregados (cupo del turno elegido), el botón se deshabilita.
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '3456' } });
    expect(screen.getByRole('button', { name: /agregar/i })).toBeDisabled();
    expect(screen.getByText('Ya alcanzaste el cupo disponible para el turno elegido (3 personas).')).toBeInTheDocument();
  });

  test('no envía si no se seleccionó ningún turno', async () => {
    renderForm();
    await avanzarAlPaso2();
    const fechaInput = document.querySelector('input[type="date"]');
    await act(async () => {
      fireEvent.change(fechaInput, { target: { value: '2026-08-10' } });
    });
    await waitFor(() => expect(screen.getByRole('option', { name: /^09:00 /  })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /registrar reserva/i }));

    await waitFor(() => {
      expect(screen.getByText('Debe seleccionar un turno')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
