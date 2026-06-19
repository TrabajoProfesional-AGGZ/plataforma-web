import { render, screen, waitFor } from '@testing-library/react';
import { SocioReservasModal } from './SocioReservasModal';
import { getReservasPorSocio } from '../../services/reservasService';
import { getInstalaciones } from '../../services/instalacionesService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/reservasService');
jest.mock('../../services/instalacionesService');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));
jest.mock('../socioAccionesExtra/SocioSubModal', () => ({
  SocioSubModal: ({ titulo, children }) => (
    <div>
      <h1>{titulo}</h1>
      {children}
    </div>
  ),
}));

const onClose = jest.fn();

describe('SocioReservasModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getInstalaciones.mockResolvedValue([{ id: 'inst-1', nombre: 'Cancha Principal' }]);
  });

  test('muestra el título correcto', () => {
    getReservasPorSocio.mockResolvedValueOnce([]);
    render(<SocioReservasModal nroSocio="1001" onClose={onClose} />);
    expect(screen.getByText('Reservas activas')).toBeInTheDocument();
  });

  test('muestra mensaje vacío cuando el socio no tiene reservas', async () => {
    getReservasPorSocio.mockResolvedValueOnce([]);
    render(<SocioReservasModal nroSocio="1001" onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByText('El socio no tiene reservas activas.')).toBeInTheDocument()
    );
  });

  test('muestra el nombre de la instalación cuando la carga es exitosa', async () => {
    getReservasPorSocio.mockResolvedValueOnce([
      {
        id: 'r-1',
        id_instalacion: 'inst-1',
        fecha_reserva: '2026-07-01',
        hora_inicio: '10:00',
        hora_fin: '12:00',
        estado: 'Confirmada',
      },
    ]);
    render(<SocioReservasModal nroSocio="1001" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Cancha Principal')).toBeInTheDocument());
  });

  test('muestra el estado de la reserva', async () => {
    getReservasPorSocio.mockResolvedValueOnce([
      {
        id: 'r-2',
        id_instalacion: 'inst-1',
        fecha_reserva: '2026-07-02',
        hora_inicio: '14:00',
        hora_fin: '16:00',
        estado: 'Confirmada',
      },
    ]);
    render(<SocioReservasModal nroSocio="1001" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Confirmada')).toBeInTheDocument());
  });

  test('usa el ID como fallback cuando la instalación no está en el mapa', async () => {
    getReservasPorSocio.mockResolvedValueOnce([
      {
        id: 'r-3',
        id_instalacion: 'inst-desconocida',
        fecha_reserva: '2026-07-03',
        hora_inicio: '09:00',
        hora_fin: '11:00',
        estado: 'Confirmada',
      },
    ]);
    render(<SocioReservasModal nroSocio="1001" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('inst-desconocida')).toBeInTheDocument());
  });

  test('muestra un botón "Ver instalación" por cada reserva', async () => {
    getReservasPorSocio.mockResolvedValueOnce([
      { id: 'r-4', id_instalacion: 'inst-1', fecha_reserva: '2026-07-01', hora_inicio: '10:00', hora_fin: '12:00', estado: 'Confirmada' },
      { id: 'r-5', id_instalacion: 'inst-1', fecha_reserva: '2026-07-02', hora_inicio: '14:00', hora_fin: '16:00', estado: 'Confirmada' },
    ]);
    render(<SocioReservasModal nroSocio="1001" onClose={onClose} />);
    await waitFor(() => expect(screen.getAllByText('Ver instalación')).toHaveLength(2));
  });
});
