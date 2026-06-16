import { render, screen, fireEvent } from '@testing-library/react';
import InstalacionesPage from './InstalacionesPage';

// Mocks de los formularios multi-paso (igual que SociosPage mockea CreateSocioForm)
jest.mock('../../components/createInstalacionForm/CreateInstalacionForm', () => ({
  CreateInstalacionForm: ({ onSuccess, onCancel }) => (
    <div>
      <button onClick={() => onSuccess({ nombre: 'Test', capacidad_maxima: 10, requiere_pago_extra: false })}>
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
function crearInstalacion() {
  fireEvent.click(screen.getByRole('button', { name: /nueva instalación/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
}

function irAlDetalle() {
  // El mock siempre crea una instalación llamada 'Test'
  fireEvent.click(screen.getByText('Test'));
}

function crearReservaInline({ titulo, solicitante, fecha, horaIni, horaFin }) {
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: titulo } });
  fireEvent.change(screen.getByLabelText('Solicitante'), { target: { value: solicitante } });
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: fecha } });
  fireEvent.change(screen.getByLabelText('Hora inicio'), { target: { value: horaIni } });
  fireEvent.change(screen.getByLabelText('Hora fin'), { target: { value: horaFin } });
  fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
}

// Devuelve el último botón con ese nombre (el de modales, siempre al final del DOM)
function ultimoBoton(nombre) {
  const botones = screen.getAllByRole('button', { name: nombre });
  return botones[botones.length - 1];
}

describe('InstalacionesPage', () => {
  test('muestra el título "Reservas e Instalaciones"', () => {
    render(<InstalacionesPage />);
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
  });

  test('muestra la sección Instalaciones y la sección Reservas', () => {
    render(<InstalacionesPage />);
    expect(screen.getByRole('heading', { name: 'Instalaciones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay instalaciones', () => {
    render(<InstalacionesPage />);
    expect(screen.getByText('No hay instalaciones registradas.')).toBeInTheDocument();
  });

  test('abre el formulario de crear instalación al hacer clic en "Nueva instalación"', () => {
    render(<InstalacionesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva instalación/i }));
    expect(screen.getByRole('button', { name: 'Confirmar creación' })).toBeInTheDocument();
  });

  test('cancela el formulario de crear instalación', () => {
    render(<InstalacionesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva instalación/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar creación' }));
    expect(screen.queryByRole('button', { name: 'Confirmar creación' })).not.toBeInTheDocument();
  });

  test('crea una instalación y la muestra en la tabla', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('10 personas')).toBeInTheDocument();
  });

  test('abre el formulario de crear reserva al hacer clic en "Nueva reserva"', () => {
    render(<InstalacionesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeInTheDocument();
  });

  test('cierra el formulario de crear reserva al confirmar (placeholder)', () => {
    render(<InstalacionesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
  });

  test('cancela el formulario de crear reserva', () => {
    render(<InstalacionesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva reserva/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument();
  });

  test('navega a la vista de detalle al hacer clic en una instalación', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
  });

  test('vuelve a la lista al hacer clic en Volver', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  test('muestra el formulario inline de reserva en la vista de detalle', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Solicitante')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora inicio')).toBeInTheDocument();
    expect(screen.getByLabelText('Hora fin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar reserva/i })).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay reservas en la instalación', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('agrega una reserva y la muestra en la tabla', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Partido amistoso',
      solicitante: 'Juan García',
      fecha: '2026-07-15',
      horaIni: '10:00',
      horaFin: '12:00',
    });
    expect(screen.getByText('Partido amistoso')).toBeInTheDocument();
    expect(screen.getByText('Juan García')).toBeInTheDocument();
  });

  test('muestra error si el título de la reserva está vacío', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('El título es obligatorio.');
  });

  test('muestra error si hora fin es anterior o igual a hora inicio', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Clase' } });
    fireEvent.change(screen.getByLabelText('Solicitante'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Hora inicio'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('Hora fin'), { target: { value: '13:00' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('La hora de fin debe ser posterior');
  });

  test('detecta conflicto de horario entre reservas', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Reserva 1',
      solicitante: 'Carlos',
      fecha: '2026-07-01',
      horaIni: '09:00',
      horaFin: '11:00',
    });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Reserva 2' } });
    fireEvent.change(screen.getByLabelText('Solicitante'), { target: { value: 'María' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('Hora inicio'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Hora fin'), { target: { value: '12:00' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar reserva/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una reserva que se superpone');
  });

  test('no detecta conflicto si las reservas son en días distintos', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'A', solicitante: 'X', fecha: '2026-07-01', horaIni: '09:00', horaFin: '11:00' });
    crearReservaInline({ titulo: 'B', solicitante: 'Y', fecha: '2026-07-02', horaIni: '09:00', horaFin: '11:00' });
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  test('no detecta conflicto si los horarios son adyacentes', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'Mañana', solicitante: 'Grupo A', fecha: '2026-07-10', horaIni: '08:00', horaFin: '10:00' });
    crearReservaInline({ titulo: 'Tarde', solicitante: 'Grupo B', fecha: '2026-07-10', horaIni: '10:00', horaFin: '12:00' });
    expect(screen.getByText('Mañana')).toBeInTheDocument();
    expect(screen.getByText('Tarde')).toBeInTheDocument();
  });

  test('edita una instalación correctamente', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(document.querySelector('#ei-nombre'), { target: { value: 'Test Renovada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Test Renovada')).toBeInTheDocument();
  });

  test('muestra error al editar instalación con nombre vacío', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(document.querySelector('#ei-nombre'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre es obligatorio.');
  });

  test('cierra el modal de editar instalación al presionar ESC', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(document.querySelector('#ei-nombre')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('#ei-nombre')).not.toBeInTheDocument();
  });

  test('elimina una instalación y vuelve a la lista', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    // Solo 1 botón "Eliminar" (no hay reservas)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText('Reservas e Instalaciones')).toBeInTheDocument();
    expect(screen.getByText('No hay instalaciones registradas.')).toBeInTheDocument();
  });

  test('cancela la eliminación de una instalación', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('cancela el modal de eliminar instalación con ESC', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('edita una reserva correctamente', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Reserva original',
      solicitante: 'Club',
      fecha: '2026-09-01',
      horaIni: '15:00',
      horaFin: '17:00',
    });
    // Con 1 reserva hay 2 botones "Editar" (instalación + fila). El de la fila es el último.
    fireEvent.click(ultimoBoton('Editar'));
    fireEvent.change(document.querySelector('#er-titulo'), { target: { value: 'Reserva editada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Reserva editada')).toBeInTheDocument();
    expect(screen.queryByText('Reserva original')).not.toBeInTheDocument();
  });

  test('muestra error en editar reserva si hora fin es inválida', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Clase',
      solicitante: 'Laura',
      fecha: '2026-10-01',
      horaIni: '09:00',
      horaFin: '11:00',
    });
    fireEvent.click(ultimoBoton('Editar'));
    fireEvent.change(document.querySelector('#er-hora-ini'), { target: { value: '12:00' } });
    fireEvent.change(document.querySelector('#er-hora-fin'), { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La hora de fin debe ser posterior');
  });

  test('elimina una reserva correctamente', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Práctica',
      solicitante: 'Equipo',
      fecha: '2026-10-05',
      horaIni: '16:00',
      horaFin: '18:00',
    });
    expect(screen.getByText('Práctica')).toBeInTheDocument();
    // 2 "Eliminar" (inst + fila). El último es el de la fila.
    fireEvent.click(ultimoBoton('Eliminar'));
    // Modal agrega 3er "Eliminar". El último es el de confirmación.
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.queryByText('Práctica')).not.toBeInTheDocument();
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('cancela la eliminación de una reserva', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'A conservar',
      solicitante: 'X',
      fecha: '2026-10-10',
      horaIni: '10:00',
      horaFin: '11:00',
    });
    fireEvent.click(ultimoBoton('Eliminar'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('A conservar')).toBeInTheDocument();
  });

  test('al eliminar instalación también se eliminan sus reservas', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Reserva temporal',
      solicitante: 'Test',
      fecha: '2026-11-01',
      horaIni: '08:00',
      horaFin: '09:00',
    });
    // Botones Eliminar: [inst(0), fila(1)]. El de instalación es el primero.
    const botonesEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(botonesEliminar[0]);
    fireEvent.click(ultimoBoton('Eliminar'));
    // Volver a crear la instalación y verificar que no tiene reservas
    crearInstalacion();
    irAlDetalle();
    expect(screen.getByText('No hay reservas para esta instalación.')).toBeInTheDocument();
  });

  test('el formulario inline se limpia después de agregar una reserva', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({
      titulo: 'Clase exitosa',
      solicitante: 'Instructor',
      fecha: '2026-12-01',
      horaIni: '09:00',
      horaFin: '10:00',
    });
    expect(screen.getByLabelText('Título').value).toBe('');
    expect(screen.getByLabelText('Solicitante').value).toBe('');
  });

  // ── Cobertura de ramas no alcanzadas ──

  test('muestra error al editar instalación con capacidad inválida', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(document.querySelector('#ei-capacidad'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La capacidad máxima es obligatoria y debe ser mayor a 0.');
  });

  test('actualiza capacidad y pago extra al editar instalación', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(document.querySelector('#ei-capacidad'), { target: { value: '25' } });
    fireEvent.click(document.querySelector('#ei-pago'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('25 personas')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument();
  });

  test('cierra el modal de editar instalación al hacer clic en el overlay', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(document.querySelector('#ei-nombre')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(document.querySelector('#ei-nombre')).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminar instalación al hacer clic en el overlay', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('ESC cierra el modal de editar reserva', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'ESC test', solicitante: 'X', fecha: '2026-07-01', horaIni: '09:00', horaFin: '10:00' });
    fireEvent.click(ultimoBoton('Editar'));
    expect(document.querySelector('#er-titulo')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('#er-titulo')).not.toBeInTheDocument();
  });

  test('ESC cierra el modal de eliminar reserva', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'Borrable', solicitante: 'Y', fecha: '2026-07-02', horaIni: '10:00', horaFin: '12:00' });
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
  });

  test('detecta conflicto al editar una reserva que se superpone con otra', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'R1', solicitante: 'A', fecha: '2026-07-01', horaIni: '09:00', horaFin: '11:00' });
    crearReservaInline({ titulo: 'R2', solicitante: 'B', fecha: '2026-07-01', horaIni: '13:00', horaFin: '15:00' });
    fireEvent.click(ultimoBoton('Editar'));
    fireEvent.change(document.querySelector('#er-hora-ini'), { target: { value: '10:00' } });
    fireEvent.change(document.querySelector('#er-hora-fin'), { target: { value: '12:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una reserva que se superpone');
  });

  test('cierra el modal de editar reserva al hacer clic en el overlay', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'Overlay test', solicitante: 'Z', fecha: '2026-07-01', horaIni: '09:00', horaFin: '10:00' });
    fireEvent.click(ultimoBoton('Editar'));
    expect(document.querySelector('#er-titulo')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(document.querySelector('#er-titulo')).not.toBeInTheDocument();
  });

  test('edita solicitante y fecha de una reserva correctamente', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'Original', solicitante: 'Antes', fecha: '2026-07-01', horaIni: '09:00', horaFin: '11:00' });
    fireEvent.click(ultimoBoton('Editar'));
    fireEvent.change(document.querySelector('#er-solicitante'), { target: { value: 'Después' } });
    fireEvent.change(document.querySelector('#er-fecha'), { target: { value: '2026-08-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Después')).toBeInTheDocument();
    expect(screen.getByText('2026-08-15')).toBeInTheDocument();
  });

  test('cancela el modal de editar reserva sin aplicar cambios', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'Sin cambios', solicitante: 'W', fecha: '2026-07-01', horaIni: '09:00', horaFin: '11:00' });
    fireEvent.click(ultimoBoton('Editar'));
    fireEvent.change(document.querySelector('#er-titulo'), { target: { value: 'Título modificado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(document.querySelector('#er-titulo')).not.toBeInTheDocument();
    expect(screen.getByText('Sin cambios')).toBeInTheDocument();
  });

  test('cierra el modal de eliminar reserva al hacer clic en el overlay', () => {
    render(<InstalacionesPage />);
    crearInstalacion();
    irAlDetalle();
    crearReservaInline({ titulo: 'Preservar', solicitante: 'P', fecha: '2026-07-01', horaIni: '09:00', horaFin: '10:00' });
    fireEvent.click(ultimoBoton('Eliminar'));
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(screen.queryByText(/estás seguro/i)).not.toBeInTheDocument();
    expect(screen.getByText('Preservar')).toBeInTheDocument();
  });
});
