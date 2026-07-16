import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TramiteReviewModal } from './TramiteReviewModal';

jest.mock('../../firebase', () => ({ auth: { currentUser: { getIdToken: jest.fn().mockResolvedValue('token') } } }));

jest.mock('../../services/tramitesService', () => ({
  revisarTramite: jest.fn(),
}));
const { revisarTramite } = require('../../services/tramitesService');

const TRAMITE_MOCK = {
  id: 't-1',
  tipo_tramite: { id: 1, nombre: 'Apto médico', requiere_vencimiento: true },
  archivo_url: 'https://res.cloudinary.com/demo/tramites/s-1/archivo.pdf',
  estado: 'en_revision',
  fecha_carga: '2026-07-10T00:00:00Z',
};

function renderModal(tramite = TRAMITE_MOCK) {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<TramiteReviewModal tramite={tramite} onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel };
}

describe('TramiteReviewModal', () => {
  beforeEach(() => {
    revisarTramite.mockResolvedValue({ ...TRAMITE_MOCK, estado: 'aprobado' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario con el tipo de trámite', () => {
    renderModal();
    expect(screen.getByText('Revisar trámite')).toBeInTheDocument();
    expect(screen.getByText('Apto médico')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Aprobado' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Rechazado' })).toBeInTheDocument();
  });

  test('el botón Confirmar está deshabilitado hasta elegir un estado', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'aprobado' } });
    expect(screen.getByRole('button', { name: /confirmar/i })).not.toBeDisabled();
  });

  test('llama a onCancel al hacer click en Cancelar', () => {
    const { onCancel } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('confirma con estado y observaciones y llama a onSuccess', async () => {
    const { onSuccess } = renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'aprobado' } });
    fireEvent.change(screen.getByLabelText('Observaciones'), { target: { value: 'Todo en orden' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(revisarTramite).toHaveBeenCalledWith('t-1', { estado: 'aprobado', observaciones: 'Todo en orden' });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('envía observaciones null si se deja vacío', async () => {
    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'rechazado' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(revisarTramite).toHaveBeenCalledWith('t-1', { estado: 'rechazado', observaciones: null });
    });
  });

  test('respeta el límite de longitud de observaciones', () => {
    renderModal();
    const textarea = screen.getByLabelText('Observaciones');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  test('muestra error si falla el servicio', async () => {
    revisarTramite.mockRejectedValue(new Error('servicio-no-disponible'));
    renderModal();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'aprobado' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
    });
  });

  test('muestra error genérico ante fallos desconocidos', async () => {
    revisarTramite.mockRejectedValue(new Error('unknown-error'));
    renderModal();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'aprobado' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al revisar el trámite/i)).toBeInTheDocument();
    });
  });

  test('llama a onCancel al hacer click en el overlay', () => {
    const { onCancel } = renderModal();
    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
