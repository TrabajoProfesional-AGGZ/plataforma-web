import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AlertasPage from './AlertasPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/alertasService', () => ({
  getAlertas: jest.fn(),
  createAlerta: jest.fn(),
  borrarAlerta: jest.fn(),
}));
import { getAlertas, createAlerta, borrarAlerta } from '../../services/alertasService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../components/createAlertaForm/CreateAlertaForm', () => ({
  CreateAlertaForm: ({ onSuccess, onCancel }) => ( // NOSONAR
    <div>
      <button onClick={() => onSuccess({ mensaje: 'Alerta nueva', filtro_categoria: null, filtro_estado: null })}>
        Confirmar creación
      </button>
      <button onClick={onCancel}>Cancelar creación</button>
    </div>
  ),
}));

const ALERTA_MOCK = {
  id: 'a-1',
  mensaje: 'Recordatorio de cuota pendiente',
  filtro_categoria: 'Juvenil',
  filtro_estado: 'Moroso',
  cantidad_destinatarios: 12,
  creado_en: '2026-06-01T12:00:00Z',
};

async function renderPage() {
  render(<AlertasPage />);
  await waitFor(() =>
    expect(document.querySelector('.list-loading')).not.toBeInTheDocument()
  );
}

describe('AlertasPage', () => {
  beforeEach(() => {
    getAlertas.mockResolvedValue([]);
    createAlerta.mockResolvedValue({ ...ALERTA_MOCK, id: 'a-new' });
    borrarAlerta.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título "Alertas"', async () => {
    await renderPage();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay alertas', async () => {
    await renderPage();
    expect(screen.getByText('No hay alertas registradas.')).toBeInTheDocument();
  });

  test('muestra un banner de error si falla la carga de alertas', async () => {
    getAlertas.mockRejectedValue(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las alertas.');
  });

  test('el botón Reintentar del banner de error vuelve a cargar las alertas', async () => {
    getAlertas.mockRejectedValueOnce(new Error('error de red'));
    await renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    getAlertas.mockResolvedValueOnce([ALERTA_MOCK]);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
  });

  test('muestra las alertas cargadas desde el servidor', async () => {
    getAlertas.mockResolvedValue([ALERTA_MOCK]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    expect(screen.getByText('Juvenil')).toBeInTheDocument();
    expect(screen.getByText('Moroso')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('muestra "Todas"/"Todos" cuando la alerta no tiene filtros', async () => {
    getAlertas.mockResolvedValue([{ ...ALERTA_MOCK, filtro_categoria: null, filtro_estado: null }]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Todas')).toBeInTheDocument());
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  test('muestra "socios específicos" y oculta filtros para alertas dirigidas', async () => {
    getAlertas.mockResolvedValue([{
      ...ALERTA_MOCK,
      filtro_categoria: null,
      filtro_estado: null,
      cantidad_destinatarios: 2,
      socios_destino: [
        { id: 's-1', nro_socio: '1000', nombre: 'Ana', apellido: 'Gómez' },
        { id: 's-2', nro_socio: '1001', nombre: 'Luis', apellido: 'Pérez' },
      ],
    }]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    expect(screen.getByText('2 (socios específicos)')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  test('el botón "Nueva alerta" abre el formulario de creación', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva alerta/i }));
    expect(screen.getByRole('button', { name: 'Confirmar creación' })).toBeInTheDocument();
  });

  test('cancelar el formulario de crear lo cierra', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva alerta/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar creación' }));
    expect(screen.queryByRole('button', { name: 'Confirmar creación' })).not.toBeInTheDocument();
  });

  test('crear alerta añade optimistamente a la lista', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva alerta/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
    expect(screen.getAllByText('Alerta nueva').length).toBeGreaterThanOrEqual(1);
  });

  test('reemplaza la alerta optimista con la respuesta del servidor', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva alerta/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
    });
    expect(createAlerta).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument();
  });

  test('revierte la alerta optimista y muestra un banner de error si createAlerta falla', async () => {
    createAlerta.mockRejectedValueOnce(new Error('error'));
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nueva alerta/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo crear la alerta.');
    });
    expect(screen.queryByText('Alerta nueva')).not.toBeInTheDocument();
  });

  test('el botón de eliminar abre el modal de confirmación', async () => {
    getAlertas.mockResolvedValue([ALERTA_MOCK]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /eliminar alerta/i }));
    expect(screen.getByText(/eliminar alerta/i)).toBeInTheDocument();
  });

  test('confirmar eliminación quita la alerta de la lista y llama borrarAlerta', async () => {
    getAlertas.mockResolvedValue([ALERTA_MOCK]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /eliminar alerta/i }));
    const btnsEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(btnsEliminar[btnsEliminar.length - 1]);
    await waitFor(() => expect(screen.queryByText('Recordatorio de cuota pendiente')).not.toBeInTheDocument());
    expect(borrarAlerta).toHaveBeenCalledWith('a-1');
  });

  test('cancelar el modal de eliminación no borra la alerta', async () => {
    getAlertas.mockResolvedValue([ALERTA_MOCK]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /eliminar alerta/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText(/estás seguro de que querés eliminar/i)).not.toBeInTheDocument();
    expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument();
    expect(borrarAlerta).not.toHaveBeenCalled();
  });

  test('revierte la alerta y muestra un banner de error si borrarAlerta falla', async () => {
    borrarAlerta.mockRejectedValueOnce(new Error('error de red'));
    getAlertas.mockResolvedValue([ALERTA_MOCK]);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /eliminar alerta/i }));
    const btnsEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(btnsEliminar[btnsEliminar.length - 1]);
    await waitFor(() => expect(screen.getByText('Recordatorio de cuota pendiente')).toBeInTheDocument());
    expect(borrarAlerta).toHaveBeenCalledWith('a-1');
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo eliminar la alerta.');
  });

  // --- Paginación y orden ---

  function crearAlertas(cantidad) {
    return Array.from({ length: cantidad }, (_, i) => ({
      id: `a-${i + 1}`,
      mensaje: `Mensaje${String(i + 1).padStart(2, '0')}`,
      filtro_categoria: null,
      filtro_estado: null,
      cantidad_destinatarios: 5,
      creado_en: `2026-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
    }));
  }

  test('no muestra controles de paginación cuando hay 10 alertas o menos', async () => {
    getAlertas.mockResolvedValue(crearAlertas(10));
    await renderPage();
    expect(screen.queryByLabelText(/paginación/i)).not.toBeInTheDocument();
  });

  test('muestra como máximo 10 filas por página y permite avanzar/retroceder', async () => {
    getAlertas.mockResolvedValue(crearAlertas(15));
    await renderPage();

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    // La más nueva (Mensaje15, creada el 2026-01-15) va primero.
    expect(screen.getByText('Mensaje15')).toBeInTheDocument();
    expect(screen.queryByText('Mensaje05')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('Mensaje05')).toBeInTheDocument();
    expect(screen.queryByText('Mensaje15')).not.toBeInTheDocument();
  });

  test('la tabla está ordenada por fecha de creación, la más nueva primero', async () => {
    getAlertas.mockResolvedValue([
      { id: 'a', mensaje: 'Vieja', filtro_categoria: null, filtro_estado: null, cantidad_destinatarios: 1, creado_en: '2026-01-01T00:00:00Z' },
      { id: 'b', mensaje: 'Nueva', filtro_categoria: null, filtro_estado: null, cantidad_destinatarios: 1, creado_en: '2026-06-01T00:00:00Z' },
      { id: 'c', mensaje: 'Media', filtro_categoria: null, filtro_estado: null, cantidad_destinatarios: 1, creado_en: '2026-03-01T00:00:00Z' },
    ]);
    await renderPage();

    const mensajes = screen.getAllByRole('row').slice(1).map((fila) => fila.querySelector('td').textContent);
    expect(mensajes).toEqual(['Nueva', 'Media', 'Vieja']);
  });
});
