import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { SocioPagosPendientesModal } from './SocioPagosPendientesModal';
import { getResumenFinanciero, marcarPagadaCaja } from '../../services/finanzasService';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/finanzasService');
jest.mock('../socioAccionesExtra/SocioSubModal', () => ({
  SocioSubModal: ({ titulo, children }) => (
    <div>
      <h1>{titulo}</h1>
      {children}
    </div>
  ),
}));
jest.mock('../confirmDeleteModal/ConfirmDeleteModal', () => ({
  __esModule: true,
  default: ({ open, mensaje, onConfirm, onCancel, guardando, errorModal }) => (
    open ? (
      <div data-testid="confirm-modal">
        <p>{mensaje}</p>
        {errorModal && <p>{errorModal}</p>}
        <button onClick={onCancel}>Cancelar confirm</button>
        <button onClick={onConfirm} disabled={guardando}>{guardando ? 'Guardando...' : 'Confirmar'}</button>
      </div>
    ) : null
  ),
}));

const CUOTA_PENDIENTE = {
  id: 'c-1',
  tipo: 'cuota',
  concepto: 'Cuota Social',
  monto: 1000,
  fecha_vencimiento: '2026-08-10',
  estado: 'Pendiente',
};

const RESERVA_PENDIENTE = {
  id: 'r-1',
  tipo: 'reserva',
  concepto: 'Reserva: Cancha 1',
  monto: 500,
  fecha_vencimiento: '2026-08-05',
  estado: 'Pendiente',
};

const CUOTA_PAGADA = {
  id: 'c-2',
  tipo: 'cuota',
  concepto: 'Cuota Social Anterior',
  monto: 1000,
  fecha_vencimiento: '2026-07-10',
  estado: 'Pagada',
};

const onClose = jest.fn();

describe('SocioPagosPendientesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título correcto y consulta el resumen financiero del socio', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [] });
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);
    expect(screen.getByText('Pagos pendientes')).toBeInTheDocument();
    await waitFor(() => expect(getResumenFinanciero).toHaveBeenCalledWith('s-1'));
  });

  test('muestra mensaje vacío cuando el socio no tiene pagos pendientes', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [] });
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('El socio no tiene pagos pendientes.')).toBeInTheDocument());
  });

  test('lista cuotas y reservas pendientes, y no lista items ya pagados', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [CUOTA_PENDIENTE, RESERVA_PENDIENTE, CUOTA_PAGADA] });
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Cuota Social')).toBeInTheDocument());
    expect(screen.getByText('Reserva: Cancha 1')).toBeInTheDocument();
    expect(screen.queryByText('Cuota Social Anterior')).not.toBeInTheDocument();
  });

  test('muestra un mensaje de error si falla la carga del resumen financiero', async () => {
    getResumenFinanciero.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('El servicio no está disponible. Intentá de nuevo más tarde.')).toBeInTheDocument());
  });

  test('al hacer click en Marcar como pagada abre el modal de confirmación', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [CUOTA_PENDIENTE] });
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Cuota Social')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pagada' }));

    const confirmModal = screen.getByTestId('confirm-modal');
    expect(confirmModal).toBeInTheDocument();
    expect(within(confirmModal).getByText(/Cuota Social/)).toBeInTheDocument();
  });

  test('al confirmar, marca el item como pagado y lo quita de la lista', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [CUOTA_PENDIENTE] });
    marcarPagadaCaja.mockResolvedValueOnce({ estado: 'Pagada' });
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Cuota Social')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pagada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(marcarPagadaCaja).toHaveBeenCalledWith('cuota', 'c-1'));
    await waitFor(() => expect(screen.queryByText('Cuota Social')).not.toBeInTheDocument());
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  test('cancelar el modal de confirmación no quita el item de la lista', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [CUOTA_PENDIENTE] });
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Cuota Social')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pagada' }));
    fireEvent.click(screen.getByText('Cancelar confirm'));

    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    expect(screen.getByText('Cuota Social')).toBeInTheDocument();
    expect(marcarPagadaCaja).not.toHaveBeenCalled();
  });

  test('muestra un error dentro del modal de confirmación si falla marcarPagadaCaja', async () => {
    getResumenFinanciero.mockResolvedValueOnce({ cuotas: [CUOTA_PENDIENTE] });
    marcarPagadaCaja.mockRejectedValueOnce(new Error('otro-error'));
    render(<SocioPagosPendientesModal idSocio="s-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText('Cuota Social')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pagada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.getByText('No se pudo marcar el pago. Intentá de nuevo.')).toBeInTheDocument());
    expect(screen.getByText('Cuota Social')).toBeInTheDocument();
  });
});
