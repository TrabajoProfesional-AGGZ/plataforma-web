import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DisciplinasPage from './DisciplinasPage';

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinas: jest.fn(),
  createDisciplina: jest.fn(),
  pausarDisciplina: jest.fn(),
  getSociosByDisciplina: jest.fn(),
}));
import { getDisciplinas, createDisciplina, pausarDisciplina, getSociosByDisciplina } from '../../services/disciplinasService';

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

jest.mock('../../components/verSocioModal/VerSocioModal', () => ({
  VerSocioModal: ({ socio, onClose }) => (
    <div data-testid="ver-socio-modal">
      <span>{socio.nro_socio}</span>
      <button onClick={onClose}>Cerrar socio</button>
    </div>
  ),
}));

async function renderPage() {
  render(<MemoryRouter><DisciplinasPage /></MemoryRouter>);
  await waitFor(() =>
    expect(document.querySelector('.disciplinas-loading')).not.toBeInTheDocument()
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
    getDisciplinas.mockResolvedValue([]);
    createDisciplina.mockResolvedValue({ id: 'test-id' });
    pausarDisciplina.mockResolvedValue(undefined);
    getSociosByDisciplina.mockResolvedValue([]);
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

  test('revierte la disciplina optimista si falla createDisciplina', async () => {
    createDisciplina.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    crearDisciplinaHelper();
    await waitFor(() => {
      expect(screen.getByText('No hay disciplinas registradas.')).toBeInTheDocument();
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
      { id: 'disc-1', nombre: 'Tenis', cupo_maximo: 15, arancelada: true, id_concepto_cobro: 101, estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Tenis')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Tenis'));
    expect(screen.getByText('Concepto de cobro')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
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

  test('muestra badge "Pausada" para disciplinas con estado Pausada', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-1', nombre: 'Yoga', cupo_maximo: 10, arancelada: false, concepto_cobro: '', estado: 'Pausada' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Pausada')).toBeInTheDocument());
  });

  // ── Tests de socios inscriptos (punto 8) ──

  test('muestra la sección "Socios inscriptos" en la vista de detalle', async () => {
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('Socios inscriptos')).toBeInTheDocument());
  });

  test('muestra mensaje vacío cuando no hay socios inscriptos', async () => {
    getSociosByDisciplina.mockResolvedValue([]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => {
      expect(screen.getByText('No hay socios inscriptos en esta disciplina.')).toBeInTheDocument();
    });
  });

  test('muestra la tabla con socios cuando getSociosByDisciplina devuelve resultados', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
      { id: 's-2', nro_socio: '2002', nombre: 'Carlos', apellido: 'Ruiz', estado: { nombre: 'Moroso' } },
    ]);

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    await waitFor(() => {
      expect(screen.getByText('2001')).toBeInTheDocument();
      expect(screen.getByText('López Ana')).toBeInTheDocument();
      expect(screen.getByText('2002')).toBeInTheDocument();
      expect(screen.getByText('Ruiz Carlos')).toBeInTheDocument();
    });
  });

  test('llama getSociosByDisciplina con el id de la disciplina actual', async () => {
    getDisciplinas.mockResolvedValue([
      { id: 'disc-uuid-conocido', nombre: 'Natación', cupo_maximo: 30, arancelada: false, concepto_cobro: '', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Natación')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Natación'));
    await waitFor(() => {
      expect(getSociosByDisciplina).toHaveBeenCalledWith('disc-uuid-conocido');
    });
  });

  test('limpia los socios al volver a la lista', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '3001', nombre: 'Pedro', apellido: 'García', estado: { nombre: 'Activo' } },
    ]);

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('3001')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));

    expect(screen.queryByText('3001')).not.toBeInTheDocument();
    expect(screen.queryByText('Socios inscriptos')).not.toBeInTheDocument();
  });

  test('muestra estado como string si el socio no tiene objeto estado', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-3', nro_socio: '4001', nombre: 'Laura', apellido: 'Díaz', estado: 'Activo' },
    ]);

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    await waitFor(() => {
      expect(screen.getByText('4001')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });
  });

  test('hacer clic en el N° de socio abre el modal del socio', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-4', nro_socio: '5001', nombre: 'María', apellido: 'González', estado: { nombre: 'Activo' } },
    ]);

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('5001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('5001'));

    expect(screen.getByTestId('ver-socio-modal')).toBeInTheDocument();
  });

  test('cerrar el modal del socio lo desmonta', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-5', nro_socio: '6001', nombre: 'Pedro', apellido: 'Ríos', estado: { nombre: 'Activo' } },
    ]);

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    await waitFor(() => expect(screen.getByText('6001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('6001'));
    expect(screen.getByTestId('ver-socio-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar socio' }));
    expect(screen.queryByTestId('ver-socio-modal')).not.toBeInTheDocument();
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

  // ── Tests del buscador por N° de socio en socios inscriptos (Tarea 3) ──

  test('muestra el input de filtro cuando hay socios inscriptos', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
    ]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByLabelText('Filtrar por número de socio')).toBeInTheDocument());
  });

  test('no muestra el input de filtro cuando no hay socios inscriptos', async () => {
    getSociosByDisciplina.mockResolvedValue([]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('No hay socios inscriptos en esta disciplina.')).toBeInTheDocument());
    expect(screen.queryByLabelText('Filtrar por número de socio')).not.toBeInTheDocument();
  });

  test('tipear en el filtro reduce la tabla de socios en tiempo real', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
      { id: 's-2', nro_socio: '2002', nombre: 'Carlos', apellido: 'Ruiz', estado: { nombre: 'Moroso' } },
    ]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('2001')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '2001' } });

    expect(screen.getByText('2001')).toBeInTheDocument();
    expect(screen.queryByText('2002')).not.toBeInTheDocument();
  });

  test('limpiar el filtro vuelve a mostrar todos los socios', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
      { id: 's-2', nro_socio: '2002', nombre: 'Carlos', apellido: 'Ruiz', estado: { nombre: 'Moroso' } },
    ]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('2001')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '2001' } });
    expect(screen.queryByText('2002')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '' } });
    expect(screen.getByText('2001')).toBeInTheDocument();
    expect(screen.getByText('2002')).toBeInTheDocument();
  });

  test('muestra mensaje cuando el filtro no coincide con ningún socio', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
    ]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('2001')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '9999' } });

    expect(screen.queryByText('2001')).not.toBeInTheDocument();
    expect(screen.getByText('No hay socios con ese número.')).toBeInTheDocument();
  });

  test('el filtro acepta coincidencia parcial del número de socio', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
      { id: 's-2', nro_socio: '3001', nombre: 'Carlos', apellido: 'Ruiz', estado: { nombre: 'Moroso' } },
    ]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByText('2001')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '001' } });

    expect(screen.getByText('2001')).toBeInTheDocument();
    expect(screen.getByText('3001')).toBeInTheDocument();
  });

  test('el filtro se resetea al salir y volver al detalle de una disciplina', async () => {
    getSociosByDisciplina.mockResolvedValue([
      { id: 's-1', nro_socio: '2001', nombre: 'Ana', apellido: 'López', estado: { nombre: 'Activo' } },
    ]);
    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();
    await waitFor(() => expect(screen.getByLabelText('Filtrar por número de socio')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Filtrar por número de socio'), { target: { value: '9999' } });
    expect(screen.getByLabelText('Filtrar por número de socio').value).toBe('9999');

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    irAlDetalle();

    await waitFor(() => expect(screen.getByLabelText('Filtrar por número de socio')).toBeInTheDocument());
    expect(screen.getByLabelText('Filtrar por número de socio').value).toBe('');
  });

  test('limpia la lista de socios si getSociosByDisciplina falla', async () => {
    getSociosByDisciplina.mockRejectedValueOnce(new Error('error de red'));

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    await waitFor(() => {
      expect(screen.getByText('No hay socios inscriptos en esta disciplina.')).toBeInTheDocument();
    });
  });

  test('revierte la disciplina optimista si pausarDisciplina falla', async () => {
    pausarDisciplina.mockRejectedValueOnce(new Error('error de red'));

    await renderPage();
    crearDisciplinaHelper();
    irAlDetalle();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(ultimoBoton('Pausar'));

    await waitFor(() => {
      expect(screen.getByText('Activa')).toBeInTheDocument();
    });
  });
});
