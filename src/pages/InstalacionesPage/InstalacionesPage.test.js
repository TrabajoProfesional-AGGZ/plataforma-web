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
  createReserva: jest.fn(),
  deleteReserva: jest.fn(),
}));
import { getReservas, createReserva, deleteReserva } from '../../services/reservasService';

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));
import { getSocioByNroSocio } from '../../services/sociosService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');

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

async function crearReservaInline({ nroSocio, fecha, horaIni, horaFin }) {
  fireEvent.change(screen.getByLabelText('Nro. de socio'), { target: { value: nroSocio } });
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: fecha } });
  fireEvent.change(screen.getByLabelText('Hora inicio'), { target: { value: horaIni } });
  fireEvent.change(screen.getByLabelText('Hora fin'), { target: { value: horaFin } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
  });
}

function ultimoBoton(nombre) {
  const botones = screen.getAllByRole('button', { name: nombre });
  return botones[botones.length - 1];
}

const SOCIO_MOCK = { id: 'socio-uuid-1', nro_socio: '1234', nombre: 'Juan', apellido: 'García' };

describe('InstalacionesPage', () => {
  beforeEach(() => {
    getInstalaciones.mockResolvedValue([]);
    createInstalacion.mockResolvedValue({ id: 'test-id' });
    deleteInstalacion.mockResolvedValue(undefined);
    getReservas.mockResolvedValue([]);
    createReserva.mockResolvedValue({ id: 'test-reserva-id' });
    deleteReserva.mockResolvedValue(undefined);
    getSocioByNroSocio.mockResolvedValue(SOCIO_MOCK);
  });

  test('muestra el título "Reservas e Instalaciones"', async () => {
    await renderPage();
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
  });

  test('muestra la sección Instalaciones y la sección Reservas', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { name: 'Instalaciones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument();
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

  test('abre el formulario de crear reserva al hacer clic en "Nueva reserva"', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeInTheDocument();
  });

  test('cierra el formulario de crear reserva al confirmar', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
  });

  test('cancela el formulario de crear reserva', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
  });

  test('navega a la vista de detalle al hacer clic en una instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nro. de socio')).toBeInTheDocument();
  });

  test('vuelve a la lista al hacer clic en Volver', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  test('muestra el formulario inline de reserva en la vista de detalle', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByLabelText('Nro. de socio')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora inicio')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora fin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar reserva/i })).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay reservas en la instalación', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('agrega una reserva y la muestra en la tabla', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '1234', fecha: '2026-07-15', horaIni: '10:00', horaFin: '12:00' });
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('2026-07-15')).toBeInTheDocument();
  });

  test('muestra error si el número de socio está vacío', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('El número de socio es obligatorio.');
  });

  test('muestra error si el socio no existe', async () => {
    getSocioByNroSocio.mockRejectedValue(new Error('socio-no-encontrado'));
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.change(screen.getByLabelText('Nro. de socio'), { target: { value: '9999' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Hora inicio'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Hora fin'), { target: { value: '11:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se encontró ningún socio con ese número.');
    });
  });

  test('muestra error si hora fin es anterior o igual a hora inicio', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    fireEvent.change(screen.getByLabelText('Nro. de socio'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Hora inicio'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('Hora fin'), { target: { value: '13:00' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('La hora de fin debe ser posterior');
  });

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
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '2001', fecha: '2026-10-05', horaIni: '16:00', horaFin: '18:00' });
    expect(screen.getByText('2001')).toBeInTheDocument();
    fireEvent.click(ultimoBoton('Eliminar'));
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.queryByText('2001')).not.toBeInTheDocument();
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('cancela la eliminación de una reserva', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '2002', fecha: '2026-10-10', horaIni: '10:00', horaFin: '11:00' });
    fireEvent.click(ultimoBoton('Eliminar'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('2002')).toBeInTheDocument();
  });

  test('al eliminar instalación también se eliminan sus reservas', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '2003', fecha: '2026-11-01', horaIni: '08:00', horaFin: '09:00' });
    const botonesEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(botonesEliminar[0]);
    await act(async () => {
      fireEvent.click(ultimoBoton('Eliminar'));
    });
    await waitFor(() => expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument());
    crearInstalacionHelper();
    fireEvent.click(screen.getAllByText('Test')[0]);
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('el formulario inline se limpia después de agregar una reserva', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '2004', fecha: '2026-12-01', horaIni: '09:00', horaFin: '10:00' });
    expect(screen.getByLabelText('Nro. de socio').value).toBe('');
  });

  test('ESC cierra el modal de eliminar reserva', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '2005', fecha: '2026-07-02', horaIni: '10:00', horaFin: '12:00' });
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminar reserva al hacer clic en el overlay', async () => {
    await renderPage();
    crearInstalacionHelper();
    irAlDetalle();
    await crearReservaInline({ nroSocio: '2006', fecha: '2026-07-01', horaIni: '09:00', horaFin: '10:00' });
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
    expect(screen.getByText('2006')).toBeInTheDocument();
  });

  // ── Tests de permisos ──

  test('muestra los botones de acción cuando el usuario tiene todos los permisos', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: /nueva instalación/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva reserva/i })).toBeInTheDocument();
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
