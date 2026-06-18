import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DisciplinasPage from './DisciplinasPage';

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinas: jest.fn(),
  createDisciplina: jest.fn(),
  pausarDisciplina: jest.fn(),
}));
import { getDisciplinas, createDisciplina, pausarDisciplina } from '../../services/disciplinasService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');

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
  render(<DisciplinasPage />);
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
      { id: 'disc-1', nombre: 'Tenis', cupo_maximo: 15, arancelada: true, concepto_cobro: 'Cuota tenis', estado: 'Activa' },
    ]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Tenis')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Tenis'));
    expect(screen.getByText('Concepto de cobro')).toBeInTheDocument();
    expect(screen.getByText('Cuota tenis')).toBeInTheDocument();
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
});
