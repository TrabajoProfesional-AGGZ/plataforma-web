import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventosPage from './EventosPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/eventosService', () => ({
  getEventos: jest.fn(),
  createEvento: jest.fn(),
}));
import { getEventos, createEvento } from '../../services/eventosService';

jest.mock('../../assets/logo_socio.png', () => 'logo_socio.png');
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');

jest.mock('../../components/createEventoForm/CreateEventoForm', () => ({
  CreateEventoForm: ({ onSuccess, onCancel }) => ( // NOSONAR
    <div>
      <button
        onClick={() =>
          onSuccess({
            nombre: 'Evento nuevo',
            descripcion: 'Desc',
            dia: '2026-12-31',
            hora_inicio: '20:00:00',
            hora_fin: '23:00:00',
            capacidad_maxima: 100,
            valor_entrada: 5000,
            foto_url: null,
          })
        }
      >
        Confirmar creación
      </button>
      <button onClick={onCancel}>Cancelar creación</button>
    </div>
  ),
}));

const EVENTO_LISTA = {
  id: 'e-1',
  nombre: 'Fiesta de fin de año',
  descripcion: 'Un evento de prueba',
  dia: '2026-12-31',
  hora_inicio: '20:00:00',
  hora_fin: '23:00:00',
  capacidad_maxima: 100,
  valor_entrada: '5000.00',
  entradas_vendidas: 10,
  foto_url: null,
};

async function renderPage() {
  render(<EventosPage />);
  await waitFor(() =>
    expect(document.querySelector('.list-loading')).not.toBeInTheDocument()
  );
}

describe('EventosPage', () => {
  beforeEach(() => {
    getEventos.mockResolvedValue([]);
    createEvento.mockResolvedValue({ ...EVENTO_LISTA, id: 'e-new', nombre: 'Evento nuevo' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título "Eventos"', async () => {
    await renderPage();
    expect(screen.getByText('Eventos')).toBeInTheDocument();
  });

  test('muestra un estado vacío cuando no hay eventos', async () => {
    await renderPage();
    expect(screen.getByText('No hay eventos registrados.')).toBeInTheDocument();
  });

  test('lista los eventos devueltos por el servicio', async () => {
    getEventos.mockResolvedValue([EVENTO_LISTA]);
    await renderPage();
    expect(screen.getByText('Fiesta de fin de año')).toBeInTheDocument();
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga', async () => {
    getEventos.mockRejectedValue(new Error('otro-error'));
    await renderPage();
    expect(screen.getByText('No se pudieron cargar los eventos.')).toBeInTheDocument();
  });

  test('muestra mensaje de servicio no disponible ante un 5xx', async () => {
    getEventos.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderPage();
    expect(screen.getByText('El servicio no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument();
  });

  test('abre el formulario de creación al hacer clic en "Nuevo evento"', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nuevo evento/i }));
    expect(screen.getByText('Confirmar creación')).toBeInTheDocument();
  });

  test('cierra el formulario al cancelar', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nuevo evento/i }));
    fireEvent.click(screen.getByText('Cancelar creación'));
    expect(screen.queryByText('Confirmar creación')).not.toBeInTheDocument();
  });

  test('agrega el evento creado a la lista de forma optimista y lo reemplaza con la respuesta del servicio', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nuevo evento/i }));
    fireEvent.click(screen.getByText('Confirmar creación'));

    expect(await screen.findByText('Evento nuevo')).toBeInTheDocument();
    await waitFor(() => expect(createEvento).toHaveBeenCalled());
  });

  test('revierte la creación optimista y muestra error si falla el servicio', async () => {
    createEvento.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nuevo evento/i }));
    fireEvent.click(screen.getByText('Confirmar creación'));

    await waitFor(() =>
      expect(screen.getByText('El servicio no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument()
    );
    expect(screen.queryByText('Evento nuevo')).not.toBeInTheDocument();
  });
});
