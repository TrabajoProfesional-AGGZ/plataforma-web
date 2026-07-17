import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DisciplinasPage from './DisciplinasPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: jest.fn(() => true),
}));
import { usePermiso } from '../../hooks/usePermiso';

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinas: jest.fn(),
  createDisciplina: jest.fn(),
  pausarDisciplina: jest.fn(),
  inscribirSocioADisciplina: jest.fn(),
}));
import { getDisciplinas, createDisciplina, pausarDisciplina, inscribirSocioADisciplina } from '../../services/disciplinasService';

jest.mock('../../services/sociosService', () => ({
  getSocioByNroSocio: jest.fn(),
}));
import { getSocioByNroSocio } from '../../services/sociosService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../assets/logo-rojo.png', () => 'logo-rojo.png');
jest.mock('../../assets/logo-amarillo.png', () => 'logo-amarillo.png');
jest.mock('../../assets/logo-naranja.png', () => 'logo-naranja.png');

jest.mock('../../components/createDisciplinaForm/CreateDisciplinaForm', () => ({
  CreateDisciplinaForm: ({ onSuccess, onCancel }) => ( // NOSONAR
    <div>
      <button onClick={() => onSuccess({ nombre: 'Natación', cupo_maximo: 30, arancelada: false, concepto_cobro: '' })}>
        Confirmar creación
      </button>
      <button onClick={onCancel}>Cancelar creación</button>
    </div>
  ),
}));

async function renderPage() {
  render(<MemoryRouter><DisciplinasPage /></MemoryRouter>);
  await waitFor(() =>
    expect(document.querySelector('.list-loading')).not.toBeInTheDocument()
  );
}

function crearDisciplinaHelper() {
  fireEvent.click(screen.getByRole('button', { name: /nueva disciplina/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
}

function irAlDetalle() {
  fireEvent.click(screen.getByText('Natación'));
}

function ultimoBoton(nombre) {
  const botones = screen.getAllByRole('button', { name: nombre });
  return botones[botones.length - 1];
}

describe('DisciplinasPage', () => {
  beforeEach(() => {
    usePermiso.mockReturnValue(true);
    getDisciplinas.mockResolvedValue([]);
    createDisciplina.mockResolvedValue({ id: 'test-id' });
    pausarDisciplina.mockResolvedValue(undefined);
    inscribirSocioADisciplina.mockResolvedValue({});
    getSocioByNroSocio.mockResolvedValue({ id: 's-1', nro_socio: '2001' });
  });

  test('muestra el título "Disciplinas"', async () => {
    await renderPage();
    expect(screen.getByText('Disciplinas')).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay disciplinas', async () => {
    await renderPage();
    expect(screen.getByText('No hay disciplinas registradas.')).toBeInTheDocument();
  });

  test('abre el formulario de crear disciplina al hacer clic en "Nueva disciplina"', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva disciplina/i }));
    expect(screen.getByRole('button', { name: 'Confirmar creación' })).toBeInTheDocument();
  });

  test('cancela el formulario de crear disciplina', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva disciplina/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar creación' }));
    expect(screen.queryByRole('button', { name: 'Confirmar creación' })).not.toBeInTheDocument();
  });

  test('crea una disciplina y la muestra en la tabla', async () => {
    await renderPage();
    crearDisciplinaHelper();
    expect(screen.getByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('30 personas')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  test('navega a la vista de detalle al hacer clic en una disciplina', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  test('vuelve a la lista al hacer clic en Volver', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(screen.getByText('Disciplinas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  test('la tarjeta de detalle muestra los campos correctos', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    expect(screen.getByText('30 personas')).toBeInTheDocument();
    expect(screen.getAllByText('No').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
  });

  test('el botón "Eliminar" está visible en el detalle con permiso borrar_disciplina', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  test('abre el modal de pausar al hacer clic en Eliminar', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/pausar disciplina/i)).toBeInTheDocument();
  });

  test('cancela el modal de pausar al hacer clic en Cancelar', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText(/pausar disciplina/i)).not.toBeInTheDocument();
  });

  test('ESC cierra el modal de pausar', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/pausar disciplina/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/pausar disciplina/i)).not.toBeInTheDocument();
  });

  test('click en overlay del modal lo cierra', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/pausar disciplina/i)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(screen.queryByText(/pausar disciplina/i)).not.toBeInTheDocument();
  });

  test('pausa una disciplina y vuelve a la lista con estado "Pausada"', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Pausar'));
    expect(screen.getByText('Disciplinas')).toBeInTheDocument();
    expect(screen.getByText('Pausada')).toBeInTheDocument();
  });

  test('revierte la disciplina optimista y muestra un banner de error si falla createDisciplina', async () => {
    createDisciplina.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    crearDisciplinaHelper();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la disciplina.');
    });
  });

  test('muestra "No hay disciplinas registradas" cuando getDisciplinas retorna lista vacía', async () => {
    getDisciplinas.mockResolvedValue([]);
    await renderPage();
    expect(screen.getByText('No hay disciplinas registradas.')).toBeInTheDocument();
  });

  test('muestra disciplinas cargadas desde el servidor en la tabla', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Tenis', cupo_maximo: 15, arancelada: true, concepto_cobro: 'Cuota tenis', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Tenis')).toBeInTheDocument());
    expect(screen.getByText('15 personas')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument();
  });

  test('muestra el concepto de cobro en detalle si la disciplina es arancelada', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Tenis', cupo_maximo: 15, arancelada: true, concepto_cobro: 'Cuota mensual', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Tenis')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Tenis'));
    expect(screen.getByText('Concepto de cobro')).toBeInTheDocument();
    expect(screen.getByText('Cuota mensual')).toBeInTheDocument();
  });

  test('no muestra concepto de cobro en detalle si no es arancelada', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Fútbol', cupo_maximo: 22, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Fútbol')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Fútbol'));
    expect(screen.queryByText('Concepto de cobro')).not.toBeInTheDocument();
  });

  test('muestra el ID de la disciplina bajo el detalle del card', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-known-id', nombre: 'Básquet', cupo_maximo: 12, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Básquet')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Básquet'));
    expect(screen.getByText('ID: disc-known-id')).toBeInTheDocument();
  });

  test('muestra "Sin límite" en la lista si la disciplina no tiene cupo_maximo', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Yoga', cupo_maximo: null, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Yoga')).toBeInTheDocument());
    expect(screen.getByText('Sin límite')).toBeInTheDocument();
  });

  test('muestra "Sin límite" en el detalle si la disciplina no tiene cupo_maximo', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Yoga', cupo_maximo: null, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Yoga')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Yoga'));
    expect(screen.getByText('Sin límite')).toBeInTheDocument();
  });

  test('muestra badge "Pausada" para disciplinas con estado Pausada', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Yoga', cupo_maximo: 10, arancelada: false, concepto_cobro: '', estado: 'Pausada' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Pausada')).toBeInTheDocument());
  });

  // ── Tests de la sección "Inscribir socio" (Feedback: se quitó la vista de socios inscriptos) ──

  test('no muestra la sección "Socios inscriptos" en la vista de detalle', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Inscribir socio' })).toBeInTheDocument());
    expect(screen.queryByText('Socios inscriptos')).not.toBeInTheDocument();
  });

  test('muestra un hint indicando que hay que filtrar por disciplina en Socios', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => {
      expect(screen.getByText(/filtrá por disciplina/i)).toBeInTheDocument();
    });
  });

  test('no muestra la sección de inscribir socio sin permiso crear_disciplina', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Natación', cupo_maximo: 30, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);
    usePermiso.mockImplementation((p) => p !== 'crear_disciplina');
    await renderPage();
    irAlDetalle();
    await waitFor(() => expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Inscribir socio' })).not.toBeInTheDocument();
  });

  test('navega al detalle cuando hay disciplinaId en location.state', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-state', nombre: 'Yoga', cupo_maximo: 10, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/disciplinas', state: { disciplinaId: 'disc-state' } }]}>
        <DisciplinasPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument());
    expect(screen.getAllByText('Yoga').length).toBeGreaterThan(0);
  });

  // ── Tests de inscripción de socio a disciplina (Feature 1) ──

  test('muestra el formulario de inscripción de socio en el detalle', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByLabelText('Número de socio a inscribir')).toBeInTheDocument());
  });

  test('inscribe un socio y muestra confirmación', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-uuid-conocido', nombre: 'Natación', cupo_maximo: 30, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);

    await renderPage();
    await waitFor(() => expect(screen.getByText('Natación')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Natación'));
    await waitFor(() => expect(screen.getByLabelText('Número de socio a inscribir')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Número de socio a inscribir'), { target: { value: '2001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir socio' }));

    await waitFor(() => {
      expect(getSocioByNroSocio).toHaveBeenCalledWith('2001');
      expect(inscribirSocioADisciplina).toHaveBeenCalledWith('disc-uuid-conocido', 's-1');
      expect(screen.getByText('Socio inscripto correctamente.')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Número de socio a inscribir').value).toBe('');
  });

  test('muestra error si el número de socio no existe', async () => {
    getSocioByNroSocio.mockRejectedValueOnce(new Error('socio-no-encontrado'));

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByLabelText('Número de socio a inscribir')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Número de socio a inscribir'), { target: { value: '9999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir socio' }));

    await waitFor(() => {
      expect(screen.getByText('No existe un socio con ese número.')).toBeInTheDocument();
    });
    expect(inscribirSocioADisciplina).not.toHaveBeenCalled();
  });

  test('muestra error si el socio ya está inscripto', async () => {
    inscribirSocioADisciplina.mockRejectedValueOnce(new Error('ya-inscripto'));

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByLabelText('Número de socio a inscribir')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Número de socio a inscribir'), { target: { value: '2001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir socio' }));

    await waitFor(() => {
      expect(screen.getByText('El socio ya está inscripto en esta disciplina.')).toBeInTheDocument();
    });
  });

  test('el botón "Inscribir socio" está deshabilitado sin número ingresado', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inscribir socio' })).toBeDisabled());
  });

  test('el mensaje de éxito de inscripción se resetea al salir y volver al detalle', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByLabelText('Número de socio a inscribir')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Número de socio a inscribir'), { target: { value: '2001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir socio' }));
    await waitFor(() => expect(screen.getByText('Socio inscripto correctamente.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    irAlDetalle();

    expect(screen.queryByText('Socio inscripto correctamente.')).not.toBeInTheDocument();
  });

  test('revierte la disciplina optimista y muestra un banner de error si pausarDisciplina falla', async () => {
    pausarDisciplina.mockRejectedValueOnce(new Error('error de red'));

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Pausar'));

    await waitFor(() => {
      expect(screen.getByText('Activa')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo pausar la disciplina.');
  });

  test('muestra un banner de error si falla la carga de disciplinas', async () => {
    getDisciplinas.mockRejectedValue(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las disciplinas.');
  });

  test('el botón Reintentar del banner de error vuelve a cargar las disciplinas', async () => {
    getDisciplinas.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    getDisciplinas.mockResolvedValueOnce([{ id: 'd-1', nombre: 'Natación', cupo_maximo: 20, arancelada: false, estado: 'Activa' }]);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() => expect(screen.getByText('Natación')).toBeInTheDocument());
  });
});
