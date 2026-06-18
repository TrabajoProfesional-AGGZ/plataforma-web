import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InstalacionesPage from './InstalacionesPage';

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/instalacionesService', () => ({
  getInstalaciones: jest.fn(),
  createInstalacion: jest.fn(),
  deleteInstalacion: jest.fn(),
}));
import { getInstalaciones, createInstalacion, deleteInstalacion } from '../../services/instalacionesService';

jest.mock('../../services/reservasService', () => ({
  getReservas: jest.fn(),
  deleteReserva: jest.fn(),
}));
import { getReservas, deleteReserva } from '../../services/reservasService';

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
      <button onClick={() => onSuccess({ nombre: 'Test', tipo: 'Deportiva', capacidad_maxima: 10, valor_hora: 1500, activa: true })}>
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

// Helpers
async function renderPage() {
  render(<InstalacionesPage />);
  await waitFor(() =>
    expect(document.querySelector('.instalaciones-loading')).not.toBeInTheDocument()
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
    reservasStore = [];
    getInstalaciones.mockResolvedValue([]);
    createInstalacion.mockResolvedValue({ id: 'test-id' });
    deleteInstalacion.mockResolvedValue(undefined);
    getReservas.mockImplementation(() => Promise.resolve([...reservasStore]));
    deleteReserva.mockResolvedValue(undefined);
    getSocios.mockResolvedValue([SOCIO_MOCK]);
  });

  test('muestra el título "Reservas e Instalaciones"', async () => {
    await renderPage();
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
  });

  test('muestra la sección Instalaciones en la vista de lista', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { name: 'Instalaciones' })).toBeInTheDocument();
  });

  test('no muestra el botón "Nueva reserva" en la vista de lista', async () => {
    await renderPage();
    expect(screen.queryByRole('button', { name: /nueva reserva/i })).not.toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay instalaciones', async () => {
    await renderPage();
    expect(screen.getByText('No hay instalaciones registradas.')).toBeInTheDocument();
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
    expect(screen.getByText('Deportiva')).toBeInTheDocument();
    expect(screen.getByText('10 personas')).toBeInTheDocument();
    expect(screen.getByText('$1500/h')).toBeInTheDocument();
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

    await waitFor(() => expect(getReservas).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    });

    await waitFor(() => {
      expect(getReservas).toHaveBeenCalledTimes(2);
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
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
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
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
      { id: 'r-2', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-05', hora_inicio: '14:00', hora_fin: '15:00' },
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
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
      { id: 'r-2', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-05', hora_inicio: '14:00', hora_fin: '15:00' },
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

  test('el botón "Ver Socio" abre un card con los datos del socio', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('Ver Socio')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ver Socio'));

    expect(screen.getByText('García Juan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  test('el card "Ver Socio" se cierra al hacer clic en Cerrar', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('Ver Socio')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ver Socio'));
    expect(screen.getByText('García Juan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText('García Juan')).not.toBeInTheDocument();
  });

  test('ESC cierra el card "Ver Socio"', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('Ver Socio')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ver Socio'));
    expect(screen.getByText('García Juan')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('García Juan')).not.toBeInTheDocument();
  });

  // ── Tests de toggle de reservas ──

  test('el toggle oculta las reservas al hacer clic en "Ocultar reservas"', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-08-01')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ocultar reservas/i }));
    expect(screen.queryByText('2026-08-01')).not.toBeInTheDocument();
  });

  test('el toggle muestra las reservas al hacer clic en "Mostrar reservas"', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-08-01', hora_inicio: '10:00', hora_fin: '11:00' },
    ]));

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
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('elimina una reserva correctamente', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-10-05', hora_inicio: '16:00', hora_fin: '18:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-10-05')).toBeInTheDocument());
    fireEvent.click(ultimoBoton('Eliminar'));
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.queryByText('2026-10-05')).not.toBeInTheDocument();
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('cancela la eliminación de una reserva', async () => {
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-10-10', hora_inicio: '10:00', hora_fin: '11:00' },
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
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-07-02', hora_inicio: '10:00', hora_fin: '12:00' },
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
    getReservas.mockImplementation((instalacionId) => Promise.resolve([
      { id: 'r-1', id_instalacion: instalacionId, id_socio: SOCIO_MOCK.id, fecha_reserva: '2026-07-01', hora_inicio: '09:00', hora_fin: '10:00' },
    ]));

    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('2026-07-01')).toBeInTheDocument());
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.modal-overlay'));
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
    expect(screen.getByText('$1500/h')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  test('no muestra el botón Editar instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});
