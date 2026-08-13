import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InstalacionesPage from './InstalacionesPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

let mockPermisoOverrides = {};
jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: (permiso) => {
    if (permiso in mockPermisoOverrides) return mockPermisoOverrides[permiso];
    return true;
  },
}));

jest.mock('../../services/instalacionesService', () => ({
  getInstalaciones: jest.fn(),
  createInstalacion: jest.fn(),
  deleteInstalacion: jest.fn(),
}));
import { getInstalaciones, createInstalacion, deleteInstalacion } from '../../services/instalacionesService';

jest.mock('../../services/reservasService', () => ({
  getReservasPorInstalacion: jest.fn(),
  getReservasPorSocio: jest.fn(),
  deleteReserva: jest.fn(),
  getReservasHistoricasPorInstalacion: jest.fn(),
}));
import { getReservasPorInstalacion, getReservasPorSocio, deleteReserva, getReservasHistoricasPorInstalacion } from '../../services/reservasService';

jest.mock('../../services/sociosService', () => ({
  getSocios: jest.fn(),
}));
import { getSocios } from '../../services/sociosService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../assets/logo-rojo.png', () => 'logo-rojo.png');
jest.mock('../../assets/logo-amarillo.png', () => 'logo-amarillo.png');
jest.mock('../../assets/logo-naranja.png', () => 'logo-naranja.png');

jest.mock('../../components/createInstalacionForm/CreateInstalacionForm', () => ({
  CreateInstalacionForm: ({ onSuccess, onCancel }) => (
    <div>
      <button onClick={() => onSuccess({ nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, duracion_turno: 60, activa: true })}>
        Confirmar creación
      </button>
      <button onClick={onCancel}>Cancelar creación</button>
    </div>
  ),
}));

jest.mock('../../components/createReservaForm/CreateReservaForm', () => ({
  CreateReservaForm: ({ onSuccess, onCancel }) => (
    <div>
      <button onClick={() => onSuccess()}>Confirmar reserva</button>
      <button onClick={onCancel}>Cancelar reserva</button>
    </div>
  ),
}));

function mockUnaReserva() {
  getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
    { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
  ]));
}

// Helpers
async function renderPage() {
  render(<MemoryRouter><InstalacionesPage /></MemoryRouter>);
  await waitFor(() =>
    expect(document.querySelector('.list-loading')).not.toBeInTheDocument()
  );
}

function crearInstalacionHelper() {
  fireEvent.click(screen.getByRole('button', { name: /nueva instalación/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
}

function irAlDetalle() {
  fireEvent.click(screen.getByText('Test'));
}

function ultimoBoton(nombre) {
  const botones = screen.getAllByRole('button', { name: nombre });
  return botones[botones.length - 1];
}

const SOCIO_MOCK = { id: 'socio-uuid-1', nro_socio: '1234', nombre: 'Juan', apellido: 'García' };

let reservasStore = [];

describe('InstalacionesPage', () => {
  beforeEach(() => {
    mockPermisoOverrides = {};
    reservasStore = [];
    getInstalaciones.mockResolvedValue([]);
    createInstalacion.mockResolvedValue({ id: 'test-id' });
    deleteInstalacion.mockResolvedValue(undefined);
    getReservasPorInstalacion.mockImplementation(() => Promise.resolve([...reservasStore]));
    getReservasPorSocio.mockResolvedValue([]);
    deleteReserva.mockResolvedValue(undefined);
    getSocios.mockResolvedValue([SOCIO_MOCK]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([]);
  });

  test('muestra el título "Reservas e Instalaciones"', async () => {
    await renderPage();
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
  });

  test('no muestra el botón "Nueva reserva" en la vista de lista', async () => {
    await renderPage();
    expect(screen.queryByRole('button', { name: /nueva reserva/i })).not.toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay instalaciones', async () => {
    await renderPage();
    expect(screen.getByText('No hay instalaciones registradas.')).toBeInTheDocument();
  });

  test('muestra un banner de error si falla la carga de instalaciones', async () => {
    getInstalaciones.mockRejectedValue(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las instalaciones.');
  });

  test('el botón Reintentar del banner de error vuelve a cargar las instalaciones', async () => {
    getInstalaciones.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    getInstalaciones.mockResolvedValueOnce([
      { id: 'i-1', nombre: 'Cancha', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 100, activa: true },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() => expect(screen.getByText('Cancha')).toBeInTheDocument());
  });

  test('abre el formulario de crear instalación al hacer clic en "Nueva instalación"', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva instalación/i }));
    expect(screen.getByRole('button', { name: 'Confirmar creación' })).toBeInTheDocument();
  });

  test('cancela el formulario de crear instalación', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva instalación/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar creación' }));
    expect(screen.queryByRole('button', { name: 'Confirmar creación' })).not.toBeInTheDocument();
  });

  test('crea una instalación y la muestra en la tabla', async () => {
    await renderPage();
    crearInstalacionHelper();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getAllByText('Deportiva').length).toBeGreaterThan(0);
    expect(screen.getByText('10 personas')).toBeInTheDocument();
    expect(screen.getByText('$1500/turno')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  test('navega a la vista de detalle al hacer clic en una instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument();
  });

  test('vuelve a la lista al hacer clic en Volver', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  test('muestra botón "Agregar reserva" fuera del card en la vista de detalle', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByRole('button', { name: /agregar reserva/i })).toBeInTheDocument();
  });

  test('al hacer clic en "Agregar reserva" se abre CreateReservaForm', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeInTheDocument();
  });

  test('cancela el formulario de crear reserva desde detalle', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
  });

  test('al confirmar la reserva se recargan las reservas de la instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(getReservasPorInstalacion).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    });

    await waitFor(() => {
      expect(getReservasPorInstalacion).toHaveBeenCalledTimes(2);
    });
  });

  test('muestra mensaje cuando no hay reservas en la instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => {
      expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
    });
  });

  test('muestra las reservas cargadas en la tabla', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => {
      expect(screen.getByText('1234')).toBeInTheDocument();
      expect(screen.getByText('2026-08-01')).toBeInTheDocument();
    });
  });

  // ── Tests de filtro de fecha ──

  test('el filtro de fecha muestra solo reservas de esa fecha', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
      { id: 'r-2', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-05', hora_inicio: '14:00', hora_fin: '15:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getAllByText('1234').length).toBe(2));

    fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2026-08-01' } });

    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
    expect(screen.queryByText('2026-08-05')).not.toBeInTheDocument();
  });

  test('limpiar el filtro de fecha muestra todas las reservas', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
      { id: 'r-2', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-05', hora_inicio: '14:00', hora_fin: '15:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getAllByText('1234').length).toBe(2));

    fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '' } });

    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
    expect(screen.getByText('2026-08-05')).toBeInTheDocument();
  });

  // ── Tests de Ver Socio ──

  test('hacer clic en el nro de socio abre un card con sus datos', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('1234')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1234'));

    expect(screen.getByText('García Juan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
  });

  test('el card del socio se cierra al hacer clic en Cerrar', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('1234')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1234'));
    expect(screen.getByText('García Juan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(screen.queryByText('García Juan')).not.toBeInTheDocument();
  });

  test('ESC cierra el card del socio', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('1234')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1234'));
    expect(screen.getByText('García Juan')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('García Juan')).not.toBeInTheDocument();
  });

  // ── Tests de toggle de reservas ──

  test('el toggle oculta las reservas al hacer clic en "Ocultar reservas"', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('2026-08-01')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ocultar reservas/i }));
    expect(screen.queryByText('2026-08-01')).not.toBeInTheDocument();
  });

  test('el toggle muestra las reservas al hacer clic en "Mostrar reservas"', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('2026-08-01')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ocultar reservas/i }));
    expect(screen.queryByText('2026-08-01')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mostrar reservas/i }));
    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
  });

  // ── Tests de eliminar ──

  test('elimina una instalación y vuelve a la lista', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
    expect(screen.getByText('No hay instalaciones registradas.')).toBeInTheDocument();
  });

  test('muestra un banner de error en la lista si falla la eliminación de la instalación', async () => {
    deleteInstalacion.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Eliminar'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo eliminar la instalación.'));
  });

  test('cancela la eliminación de una instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('cancela el modal de eliminar instalación con ESC', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminar instalación al hacer clic en el overlay', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('cancela una reserva y la mantiene visible con estado "Cancelada"', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-10-05', hora_inicio: '16:00', hora_fin: '18:00', estado: 'Confirmada' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-10-05')).toBeInTheDocument());
    fireEvent.click(ultimoBoton('Eliminar'));
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText('2026-10-05')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  test('cancela la eliminación de una reserva', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-10-10', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-10-10')).toBeInTheDocument());
    fireEvent.click(ultimoBoton('Eliminar'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('2026-10-10')).toBeInTheDocument();
  });

  test('ESC cierra el modal de eliminar reserva', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-07-02', hora_inicio: '10:00', hora_fin: '12:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-07-02')).toBeInTheDocument());
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminar reserva al hacer clic en el overlay', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-07-01', hora_inicio: '09:00', hora_fin: '10:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-07-01')).toBeInTheDocument());
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
    expect(screen.getByText('2026-07-01')).toBeInTheDocument();
  });

  // ── Tests de permisos ──

  test('muestra el botón de crear instalación cuando el usuario tiene el permiso', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: /nueva instalación/i })).toBeInTheDocument();
  });

  test('el botón "Eliminar" de instalación aparece con permiso borrar_instalacion', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  test('la tarjeta de detalle muestra los campos correctos de la instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByText('Deportiva')).toBeInTheDocument();
    expect(screen.getByText('10 personas')).toBeInTheDocument();
    expect(screen.getByText('$1500/turno')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  test('no muestra el botón Editar instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  test('muestra la tolerancia de cancelación por defecto (60 min) cuando tiempo_minimo_cancelacion es null', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-1', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true, tiempo_minimo_cancelacion: null },
    ]);
    await renderPage();
    irAlDetalle();
    expect(screen.getByText('Hasta 60 minutos antes del turno')).toBeInTheDocument();
  });

  test('muestra la tolerancia de cancelación personalizada cuando tiempo_minimo_cancelacion tiene un valor', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-1', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true, tiempo_minimo_cancelacion: 120 },
    ]);
    await renderPage();
    irAlDetalle();
    expect(screen.getByText('Hasta 120 minutos antes del turno')).toBeInTheDocument();
  });

  test('filtra instalaciones por tipo al cambiar el selector', async () => {
    await renderPage();
    crearInstalacionHelper();
    fireEvent.change(screen.getByLabelText('Filtrar por tipo'), { target: { value: 'Deportiva' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('muestra todas las instalaciones al limpiar el filtro de tipo', async () => {
    await renderPage();
    crearInstalacionHelper();
    fireEvent.change(screen.getByLabelText('Filtrar por tipo'), { target: { value: 'Deportiva' } });
    fireEvent.change(screen.getByLabelText('Filtrar por tipo'), { target: { value: '' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('revierte la instalación optimista y muestra un banner de error si falla createInstalacion', async () => {
    createInstalacion.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    crearInstalacionHelper();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la instalación.');
    });
  });

  test('hacer click en el overlay del card del socio lo cierra', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('1234')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1234'));
    expect(screen.getByText('García Juan')).toBeInTheDocument();

    const overlay = document.querySelector('.ver-socio-modal-wrapper')?.closest('.csf-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByText('García Juan')).not.toBeInTheDocument();
  });

  // ── Tests de instalación inactiva ──

  test('muestra el badge "Inactiva" para instalaciones con activa=false', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-inactiva', nombre: 'Cancha Vieja', tipo: 'Deportiva', capacidad_maxima: 5, valor_turno: 0, activa: false },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Inactiva')).toBeInTheDocument());
  });

  test('muestra "Inactiva" en el detalle de una instalación con activa=false', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-inactiva', nombre: 'Cancha Vieja', tipo: 'Deportiva', capacidad_maxima: 5, valor_turno: 0, activa: false },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Cancha Vieja')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancha Vieja'));
    expect(screen.getAllByText('Inactiva').length).toBeGreaterThan(0);
  });

  // ── Test del filtro de tipo sin coincidencias ──

  test('muestra "No hay instalaciones del tipo seleccionado" cuando el filtro no tiene coincidencias', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-dep', nombre: 'Cancha', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1000, activa: true },
      { id: 'inst-soc', nombre: 'Salon', tipo: 'Social', capacidad_maxima: 50, valor_turno: 500, activa: true },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Cancha')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por tipo'), { target: { value: 'Deportiva' } });

    fireEvent.click(screen.getByText('Cancha'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Eliminar'));

    await waitFor(() => {
      expect(screen.getByText('No hay instalaciones del tipo seleccionado.')).toBeInTheDocument();
    });
  });

  // ── Test del filtro de fecha sin coincidencias ──

  test('muestra "No hay reservas para la fecha seleccionada" si el filtro no coincide con ninguna reserva', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-08-01')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2026-09-15' } });

    expect(screen.getByText('No hay reservas para la fecha seleccionada.')).toBeInTheDocument();
    expect(screen.queryByText('2026-08-01')).not.toBeInTheDocument();
  });

  // ── Tests de Ver Socio con campos opcionales ──

  test('el modal Ver Socio muestra todos los campos opcionales del socio', async () => {
    const SOCIO_COMPLETO = {
      id: 'socio-uuid-full',
      nro_socio: '9999',
      nombre: 'Ana',
      apellido: 'Pérez',
      nro_documento: '12345678',
      fecha_nacimiento: '1990-05-20',
      email: 'ana@example.com',
      telefono: '11-1234-5678',
      categoria: { nombre: 'Junior' },
      estado: { nombre: 'Activo' },
    };
    getSocios.mockResolvedValue([SOCIO_COMPLETO]);
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [{ id: SOCIO_COMPLETO.id, nro_socio: SOCIO_COMPLETO.nro_socio, nombre: SOCIO_COMPLETO.nombre, apellido: SOCIO_COMPLETO.apellido }], fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('9999')).toBeInTheDocument());
    fireEvent.click(screen.getByText('9999'));

    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('1990-05-20')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('11-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('Junior')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  // ── Tests de IDs y columna Acciones ──

  test('muestra el ID de la instalación bajo el detalle del card', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-known-id', nombre: 'Pileta', tipo: 'Deportiva', capacidad_maxima: 20, valor_turno: 2000, activa: true },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Pileta')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Pileta'));
    expect(screen.getByText('ID: inst-known-id')).toBeInTheDocument();
  });

  test('muestra la columna ID en la tabla de reservas', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'reserva-id-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-09-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-09-01')).toBeInTheDocument());
    expect(screen.getByText('reserva-id-1')).toBeInTheDocument();
  });

  test('no muestra la columna Acciones si el usuario no tiene permiso borrar_reserva', async () => {
    mockPermisoOverrides = { borrar_reserva: false };
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-perm', id_instalacion: instalacionId, socios: [SOCIO_MOCK],fecha_reserva: '2026-09-10', hora_inicio: '12:00', hora_fin: '13:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-09-10')).toBeInTheDocument());
    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).not.toBeInTheDocument();
  });

  test('el modal Ver Socio muestra categoría y estado cuando son strings', async () => {
    const SOCIO_STRINGS = {
      id: 'socio-uuid-str',
      nro_socio: '8888',
      nombre: 'Luis',
      apellido: 'Torres',
      categoria: 'Adulto',
      estado: 'Moroso',
    };
    getSocios.mockResolvedValue([SOCIO_STRINGS]);
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-2', id_instalacion: instalacionId, socios: [SOCIO_STRINGS], fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('8888')).toBeInTheDocument());
    fireEvent.click(screen.getByText('8888'));

    expect(screen.getByText('Adulto')).toBeInTheDocument();
    expect(screen.getByText('Moroso')).toBeInTheDocument();
  });

  // ── Tests de nuevo endpoint por instalación (punto 7) ──

  test('usa getReservasPorInstalacion para cargar reservas del detalle', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-known', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));
    await waitFor(() => expect(getReservasPorInstalacion).toHaveBeenCalled());
    expect(getReservasPorInstalacion).toHaveBeenCalledWith('inst-known');
  });

  // ── Tests de búsqueda por N° de socio (punto 7) ──

  test('muestra el input de filtro por N° de socio en la vista de detalle', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByLabelText('Filtrar por número de socio')).toBeInTheDocument();
  });

  test('buscar por N° de socio llama a getReservasPorSocio y muestra resultados filtrados', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-busqueda', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorSocio.mockResolvedValue([
      { id: 'r-socio', id_instalacion: 'inst-busqueda', socios: [SOCIO_MOCK],fecha_reserva: '2026-09-20', hora_inicio: '09:00', hora_fin: '10:00' },
    ]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    const inputSocio = await screen.findByLabelText('Filtrar por número de socio');
    fireEvent.change(inputSocio, { target: { value: '1234' } });
    await act(async () => {
      fireEvent.keyDown(inputSocio, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(getReservasPorSocio).toHaveBeenCalledWith('1234');
      expect(screen.getByText('2026-09-20')).toBeInTheDocument();
    });
  });

  test('limpiar el filtro por N° de socio vuelve a mostrar todas las reservas', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-limpiar', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([
      { id: 'r-inst', id_instalacion: 'inst-limpiar', socios: [SOCIO_MOCK],fecha_reserva: '2026-10-01', hora_inicio: '08:00', hora_fin: '09:00' },
    ]);
    getReservasPorSocio.mockResolvedValue([]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    await waitFor(() => expect(screen.getByText('2026-10-01')).toBeInTheDocument());

    const inputSocio = screen.getByLabelText('Filtrar por número de socio');
    fireEvent.change(inputSocio, { target: { value: '9999' } });
    await act(async () => {
      fireEvent.keyDown(inputSocio, { key: 'Enter' });
    });

    await waitFor(() => expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument());

    fireEvent.change(inputSocio, { target: { value: '' } });
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
  });

  // ── Test de bug dialog→div (punto 9) ──

  test('el wrapper del card de socio es un div, no un dialog', async () => {
    mockUnaReserva();
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('1234')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1234'));
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('.ver-socio-modal-wrapper')).toBeInTheDocument();
  });

  // ── Tests de location.state (punto 10) ──

  test('navega al detalle de instalación cuando hay instalacionId en location.state', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-state-test', nombre: 'Cancha de tenis', tipo: 'Deportiva', capacidad_maxima: 4, valor_turno: 1000, activa: true },
    ]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/instalaciones', state: { instalacionId: 'inst-state-test' } }]}>
        <InstalacionesPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument());
    expect(screen.getAllByText('Cancha de tenis').length).toBeGreaterThan(0);
  });

  // ── Tests de reservas históricas ──

  test('muestra reservas históricas al hacer clic en "Ver reservas históricas"', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-hist', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([
      { id: 'hist-1', id_instalacion: 'inst-hist', socios: [SOCIO_MOCK],fecha_reserva: '2025-01-01', hora_inicio: '10:00', hora_fin: '11:00', estado: 'Completada' },
    ]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    await waitFor(() => expect(screen.getByRole('button', { name: /ver reservas históricas/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });

    await waitFor(() => expect(screen.getByText('2025-01-01')).toBeInTheDocument());
    expect(getReservasHistoricasPorInstalacion).toHaveBeenCalledWith('inst-hist');
  });

  test('vuelve a las reservas activas al hacer clic en "Ver reservas activas"', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-toggle', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([
      { id: 'r-act', id_instalacion: 'inst-toggle', socios: [SOCIO_MOCK],fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([
      { id: 'hist-2', id_instalacion: 'inst-toggle', socios: [SOCIO_MOCK],fecha_reserva: '2025-03-15', hora_inicio: '14:00', hora_fin: '15:00', estado: 'Completada' },
    ]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    await waitFor(() => expect(screen.getByText('2026-08-01')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });
    await waitFor(() => expect(screen.getByText('2025-03-15')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ver reservas activas/i }));
    expect(screen.queryByText('2025-03-15')).not.toBeInTheDocument();
    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
  });

  // ── Tests del bug fix en vista histórica (Tarea 2) ──

  test('al volver a reservas activas después de buscar, las reservas activas son visibles', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-bugfix', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([
      { id: 'r-act', id_instalacion: 'inst-bugfix', socios: [SOCIO_MOCK],fecha_reserva: '2026-11-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]);
    getReservasPorSocio.mockResolvedValue([]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));
    await waitFor(() => expect(screen.getByText('2026-11-01')).toBeInTheDocument());

    const inputSocio = screen.getByLabelText('Filtrar por número de socio');
    fireEvent.change(inputSocio, { target: { value: '9999' } });
    await act(async () => {
      fireEvent.keyDown(inputSocio, { key: 'Enter' });
    });
    await waitFor(() => expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: /ver reservas activas/i }));

    expect(screen.getByText('2026-11-01')).toBeInTheDocument();
  });

  test('en la vista histórica el filtro por N° de socio filtra client-side sin llamar a la API', async () => {
    const SOCIO2 = { id: 'socio-2', nro_socio: '9999', nombre: 'Maria', apellido: 'Perez' };
    getInstalaciones.mockResolvedValue([
      { id: 'inst-cs', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getSocios.mockResolvedValue([SOCIO_MOCK, SOCIO2]);
    getReservasPorInstalacion.mockResolvedValue([]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([
      { id: 'h1', id_instalacion: 'inst-cs', socios: [SOCIO_MOCK],fecha_reserva: '2025-01-10', hora_inicio: '10:00', hora_fin: '11:00', estado: 'Completada' },
      { id: 'h2', id_instalacion: 'inst-cs', socios: [SOCIO2], fecha_reserva: '2025-02-20', hora_inicio: '14:00', hora_fin: '15:00', estado: 'Completada' },
    ]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });
    await waitFor(() => expect(screen.getByText('2025-01-10')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '1234' } });

    expect(screen.getByText('2025-01-10')).toBeInTheDocument();
    expect(screen.queryByText('2025-02-20')).not.toBeInTheDocument();
    expect(getReservasPorSocio).not.toHaveBeenCalled();
  });

  test('presionar Enter en la vista histórica no llama a getReservasPorSocio', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-ent', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /ver reservas activas/i })).toBeInTheDocument());

    const inputSocio = screen.getByLabelText('Filtrar por número de socio');
    fireEvent.change(inputSocio, { target: { value: '1234' } });
    await act(async () => {
      fireEvent.keyDown(inputSocio, { key: 'Enter' });
    });

    expect(getReservasPorSocio).not.toHaveBeenCalled();
  });

  test('al cambiar a la vista histórica, el filtro de N° de socio se limpia', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-rst', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    const inputSocio = screen.getByLabelText('Filtrar por número de socio');
    fireEvent.change(inputSocio, { target: { value: '1234' } });
    expect(inputSocio.value).toBe('1234');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /ver reservas activas/i })).toBeInTheDocument());

    expect(screen.getByLabelText('Filtrar por número de socio').value).toBe('');
  });

  test('al volver a la vista activa, el filtro de N° de socio se limpia', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-rst2', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([]);
    getReservasHistoricasPorInstalacion.mockResolvedValue([]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ver reservas históricas/i }));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /ver reservas activas/i })).toBeInTheDocument());

    const inputSocio = screen.getByLabelText('Filtrar por número de socio');
    fireEvent.change(inputSocio, { target: { value: '9999' } });
    expect(inputSocio.value).toBe('9999');

    fireEvent.click(screen.getByRole('button', { name: /ver reservas activas/i }));
    expect(screen.getByLabelText('Filtrar por número de socio').value).toBe('');
  });

  // ── Test de buscarPorSocio con input vacío via Enter ──

  test('presionar Enter con el filtro de socio vacío limpia los resultados de búsqueda', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'inst-busq-vacia', nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 1500, activa: true },
    ]);
    getReservasPorInstalacion.mockResolvedValue([
      { id: 'r-base', id_instalacion: 'inst-busq-vacia', socios: [SOCIO_MOCK],fecha_reserva: '2026-09-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]);
    getReservasPorSocio.mockResolvedValue([]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test'));
    await waitFor(() => expect(screen.getByText('2026-09-01')).toBeInTheDocument());

    const inputSocio = screen.getByLabelText('Filtrar por número de socio');

    fireEvent.change(inputSocio, { target: { value: '9999' } });
    await act(async () => {
      fireEvent.keyDown(inputSocio, { key: 'Enter' });
    });
    await waitFor(() => expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument());

    fireEvent.change(inputSocio, { target: { value: '' } });
    await act(async () => {
      fireEvent.keyDown(inputSocio, { key: 'Enter' });
    });

    expect(screen.getByText('2026-09-01')).toBeInTheDocument();
  });

  // --- Paginación y orden ---

  function crearInstalaciones(cantidad) {
    return Array.from({ length: cantidad }, (_, i) => ({
      id: `inst-${i + 1}`,
      nombre: `Instalacion${String(i + 1).padStart(2, '0')}`,
      tipo: 'Deportiva',
      capacidad_maxima: 10,
      valor_turno: 100,
      activa: true,
    }));
  }

  test('no muestra controles de paginación cuando hay 10 instalaciones o menos', async () => {
    getInstalaciones.mockResolvedValue(crearInstalaciones(10));
    await renderPage();
    expect(screen.queryByLabelText(/paginación/i)).not.toBeInTheDocument();
  });

  test('muestra como máximo 10 filas por página y permite avanzar/retroceder', async () => {
    getInstalaciones.mockResolvedValue(crearInstalaciones(15));
    await renderPage();

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Instalacion01')).toBeInTheDocument();
    expect(screen.queryByText('Instalacion11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('Instalacion11')).toBeInTheDocument();
    expect(screen.queryByText('Instalacion01')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /página anterior/i }));
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });

  test('la tabla está ordenada alfabéticamente por nombre', async () => {
    getInstalaciones.mockResolvedValue([
      { id: 'a', nombre: 'Zumba Salon', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 100, activa: true },
      { id: 'b', nombre: 'Cancha de Fútbol', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 100, activa: true },
      { id: 'c', nombre: 'Natatorio', tipo: 'Deportiva', capacidad_maxima: 10, valor_turno: 100, activa: true },
    ]);
    await renderPage();

    const nombres = screen
      .getAllByRole('button', { name: /ver detalle de/i })
      .map((fila) => fila.querySelector('td').textContent);
    expect(nombres).toEqual(['Cancha de Fútbol', 'Natatorio', 'Zumba Salon']);
  });

  // --- Paginación y orden de reservas dentro del detalle de instalación ---

  function crearReservas(cantidad) {
    return Array.from({ length: cantidad }, (_, i) => ({
      id: `r-${i + 1}`,
      socios: [SOCIO_MOCK],
      fecha_reserva: `2026-01-${String(i + 1).padStart(2, '0')}`,
      hora_inicio: '10:00',
      hora_fin: '11:00',
    }));
  }

  test('no muestra controles de paginación de reservas cuando hay 10 o menos', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) =>
      Promise.resolve(crearReservas(10).map((r) => ({ ...r, id_instalacion: instalacionId })))
    );
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-01-01')).toBeInTheDocument());
    expect(screen.queryByLabelText(/paginación/i)).not.toBeInTheDocument();
  });

  test('pagina las reservas de a 10 y permite avanzar/retroceder', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) =>
      Promise.resolve(crearReservas(15).map((r) => ({ ...r, id_instalacion: instalacionId })))
    );
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('Página 1 de 2')).toBeInTheDocument());
    // La más cercana (2026-01-01) va primero.
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    expect(screen.queryByText('2026-01-11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('2026-01-11')).toBeInTheDocument();
    expect(screen.queryByText('2026-01-01')).not.toBeInTheDocument();
  });

  test('las reservas se ordenan por fecha y hora, la más cercana primero', async () => {
    getReservasPorInstalacion.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, socios: [SOCIO_MOCK], fecha_reserva: '2026-08-05', hora_inicio: '09:00', hora_fin: '10:00' },
      { id: 'r-2', id_instalacion: instalacionId, socios: [SOCIO_MOCK], fecha_reserva: '2026-08-01', hora_inicio: '15:00', hora_fin: '16:00' },
      { id: 'r-3', id_instalacion: instalacionId, socios: [SOCIO_MOCK], fecha_reserva: '2026-08-01', hora_inicio: '08:00', hora_fin: '09:00' },
    ]));
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getAllByText('1234').length).toBe(3));

    const fechas = screen.getAllByRole('row').slice(1).map((fila) => fila.querySelectorAll('td')[2].textContent);
    expect(fechas).toEqual(['2026-08-01', '2026-08-01', '2026-08-05']);
  });
});
