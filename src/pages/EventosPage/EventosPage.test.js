import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventosPage from './EventosPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: jest.fn(() => true),
}));
import { usePermiso } from '../../hooks/usePermiso';

jest.mock('../../services/eventosService', () => ({
  getEventos: jest.fn(),
  getEventosHistoricos: jest.fn(),
  createEvento: jest.fn(),
}));
import { getEventos, getEventosHistoricos, createEvento } from '../../services/eventosService';

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

jest.mock('../../components/reservarEntradaForm/ReservarEntradaForm', () => ({
  ReservarEntradaForm: ({ evento, onSuccess, onCancel }) => ( // NOSONAR
    <div>
      <span>Reservando entrada para {evento.nombre}</span>
      <button onClick={onSuccess}>Confirmar reserva de entrada</button>
      <button onClick={onCancel}>Cancelar reserva de entrada</button>
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
    usePermiso.mockReturnValue(true);
    getEventos.mockResolvedValue([]);
    getEventosHistoricos.mockResolvedValue([]);
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

  test('no muestra el botón "Nuevo evento" sin el permiso crear_evento', async () => {
    usePermiso.mockImplementation((nombre) => nombre !== 'crear_evento');
    await renderPage();
    expect(screen.queryByRole('button', { name: /nuevo evento/i })).not.toBeInTheDocument();
  });

  test('no carga eventos si no tiene el permiso ver_eventos', async () => {
    usePermiso.mockImplementation((nombre) => nombre !== 'ver_eventos');
    render(<EventosPage />);
    await waitFor(() => expect(screen.getByText('Eventos')).toBeInTheDocument());
    expect(getEventos).not.toHaveBeenCalled();
  });

  test('muestra la foto del evento cuando tiene foto_url', async () => {
    getEventos.mockResolvedValue([{ ...EVENTO_LISTA, foto_url: 'https://res.cloudinary.com/x/foto.jpg' }]);
    await renderPage();
    const img = document.querySelector('.eventos-thumb');
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/x/foto.jpg');
  });

  test('muestra el banner de error sobre la tabla si falla la creación con eventos ya cargados', async () => {
    getEventos.mockResolvedValue([EVENTO_LISTA]);
    createEvento.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nuevo evento/i }));
    fireEvent.click(screen.getByText('Confirmar creación'));

    await waitFor(() =>
      expect(screen.getByText('El servicio no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument()
    );
    expect(screen.getByText('Fiesta de fin de año')).toBeInTheDocument();
  });

  test('no muestra la columna de acciones ni el botón "Reservar entrada" sin el permiso crear_entrada', async () => {
    usePermiso.mockImplementation((nombre) => nombre !== 'crear_entrada');
    getEventos.mockResolvedValue([EVENTO_LISTA]);
    await renderPage();
    expect(screen.queryByRole('button', { name: /reservar entrada/i })).not.toBeInTheDocument();
  });

  test('abre el formulario de reservar entrada al hacer click en el botón de la fila', async () => {
    getEventos.mockResolvedValue([EVENTO_LISTA]);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));
    expect(screen.getByText('Reservando entrada para Fiesta de fin de año')).toBeInTheDocument();
  });

  test('cierra el formulario de reservar entrada al cancelar', async () => {
    getEventos.mockResolvedValue([EVENTO_LISTA]);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));
    fireEvent.click(screen.getByText('Cancelar reserva de entrada'));
    expect(screen.queryByText('Reservando entrada para Fiesta de fin de año')).not.toBeInTheDocument();
  });

  test('al confirmar la reserva de entrada, incrementa entradas_vendidas y cierra el formulario', async () => {
    getEventos.mockResolvedValue([EVENTO_LISTA]);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /reservar entrada/i }));
    fireEvent.click(screen.getByText('Confirmar reserva de entrada'));

    expect(screen.queryByText('Reservando entrada para Fiesta de fin de año')).not.toBeInTheDocument();
    expect(screen.getByText('11 / 100')).toBeInTheDocument();
  });

  test('deshabilita el botón "Reservar entrada" para un evento creado de forma optimista', async () => {
    getEventos.mockResolvedValue([]);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /nuevo evento/i }));
    fireEvent.click(screen.getByText('Confirmar creación'));

    expect(await screen.findByText('Evento nuevo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reservar entrada/i })).toBeDisabled();
  });

  describe('toggle vigentes / históricos', () => {
    const EVENTO_HISTORICO = {
      id: 'e-viejo',
      nombre: 'Torneo del año pasado',
      descripcion: 'Un evento ya finalizado',
      dia: '2020-01-01',
      hora_inicio: '20:00:00',
      hora_fin: '23:00:00',
      capacidad_maxima: 50,
      valor_entrada: '1000.00',
      entradas_vendidas: 50,
      foto_url: null,
    };

    test('al hacer clic en "Ver eventos históricos" carga y muestra los históricos', async () => {
      getEventos.mockResolvedValue([EVENTO_LISTA]);
      getEventosHistoricos.mockResolvedValue([EVENTO_HISTORICO]);
      await renderPage();

      fireEvent.click(screen.getByRole('button', { name: /ver eventos históricos/i }));

      expect(await screen.findByText('Torneo del año pasado')).toBeInTheDocument();
      expect(screen.queryByText('Fiesta de fin de año')).not.toBeInTheDocument();
      expect(getEventosHistoricos).toHaveBeenCalled();
    });

    test('oculta "Nuevo evento" y la columna de acciones en la vista de históricos', async () => {
      getEventos.mockResolvedValue([EVENTO_LISTA]);
      getEventosHistoricos.mockResolvedValue([EVENTO_HISTORICO]);
      await renderPage();

      fireEvent.click(screen.getByRole('button', { name: /ver eventos históricos/i }));
      await screen.findByText('Torneo del año pasado');

      expect(screen.queryByRole('button', { name: /nuevo evento/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reservar entrada/i })).not.toBeInTheDocument();
    });

    test('vuelve a la vista de vigentes con "Ver eventos vigentes"', async () => {
      getEventos.mockResolvedValue([EVENTO_LISTA]);
      getEventosHistoricos.mockResolvedValue([EVENTO_HISTORICO]);
      await renderPage();

      fireEvent.click(screen.getByRole('button', { name: /ver eventos históricos/i }));
      await screen.findByText('Torneo del año pasado');

      fireEvent.click(screen.getByRole('button', { name: /ver eventos vigentes/i }));

      expect(screen.getByText('Fiesta de fin de año')).toBeInTheDocument();
      expect(screen.queryByText('Torneo del año pasado')).not.toBeInTheDocument();
    });

    test('muestra estado vacío específico si no hay eventos históricos', async () => {
      getEventos.mockResolvedValue([]);
      getEventosHistoricos.mockResolvedValue([]);
      await renderPage();

      fireEvent.click(screen.getByRole('button', { name: /ver eventos históricos/i }));

      expect(await screen.findByText('No hay eventos históricos.')).toBeInTheDocument();
    });

    test('muestra error si falla la carga de históricos', async () => {
      getEventos.mockResolvedValue([]);
      getEventosHistoricos.mockRejectedValue(new Error('servicio-no-disponible'));
      await renderPage();

      fireEvent.click(screen.getByRole('button', { name: /ver eventos históricos/i }));

      expect(
        await screen.findByText('El servicio no está disponible. Intentá de nuevo más tarde.')
      ).toBeInTheDocument();
    });
  });
});
