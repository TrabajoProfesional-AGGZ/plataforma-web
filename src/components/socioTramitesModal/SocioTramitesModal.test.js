import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SocioTramitesModal } from './SocioTramitesModal';
import { getTramitesPorSocio, getTramite } from '../../services/tramitesService';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/tramitesService');
jest.mock('../socioAccionesExtra/SocioSubModal', () => ({
  SocioSubModal: ({ titulo, children }) => (
    <div>
      <h1>{titulo}</h1>
      {children}
    </div>
  ),
}));
jest.mock('../tramiteReviewModal/TramiteReviewModal', () => ({
  TramiteReviewModal: ({ tramite, onSuccess, onCancel }) => (
    <div data-testid="review-modal">
      <span>Revisando {tramite.tipo_tramite.nombre}</span>
      <button onClick={() => onSuccess({ ...tramite, estado: 'aprobado', observaciones: 'ok' })}>Aprobar</button>
      <button onClick={onCancel}>Cancelar revisión</button>
    </div>
  ),
}));

const TRAMITE_LISTA = {
  id: 't-1',
  tipo_tramite: { id: 1, nombre: 'Apto médico', requiere_vencimiento: true },
  estado: 'en_revision',
  fecha_carga: '2026-07-10T00:00:00Z',
};

const TRAMITE_DETALLE = {
  ...TRAMITE_LISTA,
  archivo_url: 'https://res.cloudinary.com/demo/tramites/s-1/archivo.pdf',
  fecha_vencimiento: '2027-07-10',
  observaciones: null,
  revisado_en: null,
};

const onClose = jest.fn();

describe('SocioTramitesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título correcto', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([]);
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);
    expect(screen.getByText('Trámites')).toBeInTheDocument();
    await waitFor(() => expect(getTramitesPorSocio).toHaveBeenCalledWith('s-1'));
  });

  test('muestra mensaje vacío cuando el socio no tiene trámites', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([]);
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('El socio no tiene trámites cargados.')).toBeInTheDocument());
  });

  test('lista los trámites con su tipo y estado', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([TRAMITE_LISTA]);
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Apto médico')).toBeInTheDocument());
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });

  test('al hacer click en un trámite muestra el detalle con el archivo', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([TRAMITE_LISTA]);
    getTramite.mockResolvedValueOnce(TRAMITE_DETALLE);
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Apto médico')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ver detalle de apto médico/i }));

    await waitFor(() => expect(getTramite).toHaveBeenCalledWith('t-1'));
    await waitFor(() => expect(screen.getByText('Ver archivo')).toBeInTheDocument());
    expect(screen.getByText('Fecha de vencimiento: 2027-07-10')).toBeInTheDocument();
  });

  test('el botón Volver regresa a la lista', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([TRAMITE_LISTA]);
    getTramite.mockResolvedValueOnce(TRAMITE_DETALLE);
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Apto médico')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ver detalle de apto médico/i }));
    await waitFor(() => expect(screen.getByText('Ver archivo')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Volver'));
    expect(screen.queryByText('El socio no tiene trámites cargados.')).not.toBeInTheDocument();
    expect(screen.getAllByText('Apto médico')).toHaveLength(1);
  });

  test('solo muestra el botón Revisar si el estado es en_revision', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([TRAMITE_LISTA]);
    getTramite.mockResolvedValueOnce({ ...TRAMITE_DETALLE, estado: 'aprobado' });
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Apto médico')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ver detalle de apto médico/i }));

    await waitFor(() => expect(screen.getByText('Ver archivo')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /^revisar$/i })).not.toBeInTheDocument();
  });

  test('abre el modal de revisión y actualiza el trámite al confirmar', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([TRAMITE_LISTA]);
    getTramite.mockResolvedValueOnce(TRAMITE_DETALLE);
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Apto médico')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ver detalle de apto médico/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^revisar$/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^revisar$/i }));
    expect(screen.getByTestId('review-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Aprobar'));
    await waitFor(() => expect(screen.queryByTestId('review-modal')).not.toBeInTheDocument());
    expect(screen.getByText('Observaciones: ok')).toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga del detalle', async () => {
    getTramitesPorSocio.mockResolvedValueOnce([TRAMITE_LISTA]);
    getTramite.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SocioTramitesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Apto médico')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /ver detalle de apto médico/i }));

    await waitFor(() => expect(screen.getByText('No se pudo cargar el trámite.')).toBeInTheDocument());
  });
});
