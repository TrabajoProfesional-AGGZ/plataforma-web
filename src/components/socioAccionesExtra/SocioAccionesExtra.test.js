import { render, screen, fireEvent } from '@testing-library/react';
import { SocioAccionesExtra } from './SocioAccionesExtra';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../hooks/usePermiso');
jest.mock('../socioDisciplinasModal/SocioDisciplinasModal', () => ({
  SocioDisciplinasModal: ({ onClose }) => (
    <div data-testid="disciplinas-modal">
      <button onClick={onClose}>Cerrar disciplinas</button>
    </div>
  ),
}));
jest.mock('../socioReservasModal/SocioReservasModal', () => ({
  SocioReservasModal: ({ onClose }) => (
    <div data-testid="reservas-modal">
      <button onClick={onClose}>Cerrar reservas</button>
    </div>
  ),
}));
jest.mock('../socioTramitesModal/SocioTramitesModal', () => ({
  SocioTramitesModal: ({ onClose }) => (
    <div data-testid="tramites-modal">
      <button onClick={onClose}>Cerrar trámites</button>
    </div>
  ),
}));

import { usePermiso } from '../../hooks/usePermiso';

describe('SocioAccionesExtra', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra los tres botones cuando el usuario tiene los tres permisos', () => {
    usePermiso.mockImplementation((p) => p === 'ver_disciplinas' || p === 'ver_reservas' || p === 'ver_tramites');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    expect(screen.getByText('Ver disciplinas inscriptas')).toBeInTheDocument();
    expect(screen.getByText('Ver reservas activas')).toBeInTheDocument();
    expect(screen.getByText('Ver trámites')).toBeInTheDocument();
  });

  test('no renderiza nada si el usuario no tiene ningún permiso', () => {
    usePermiso.mockReturnValue(false);
    const { container } = render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    expect(container.firstChild).toBeNull();
  });

  test('solo muestra "Ver disciplinas" si solo tiene ese permiso', () => {
    usePermiso.mockImplementation((p) => p === 'ver_disciplinas');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    expect(screen.getByText('Ver disciplinas inscriptas')).toBeInTheDocument();
    expect(screen.queryByText('Ver reservas activas')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver trámites')).not.toBeInTheDocument();
  });

  test('solo muestra "Ver reservas" si solo tiene ese permiso', () => {
    usePermiso.mockImplementation((p) => p === 'ver_reservas');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    expect(screen.queryByText('Ver disciplinas inscriptas')).not.toBeInTheDocument();
    expect(screen.getByText('Ver reservas activas')).toBeInTheDocument();
    expect(screen.queryByText('Ver trámites')).not.toBeInTheDocument();
  });

  test('solo muestra "Ver trámites" si solo tiene ese permiso', () => {
    usePermiso.mockImplementation((p) => p === 'ver_tramites');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    expect(screen.queryByText('Ver disciplinas inscriptas')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver reservas activas')).not.toBeInTheDocument();
    expect(screen.getByText('Ver trámites')).toBeInTheDocument();
  });

  test('abre el modal de disciplinas al hacer click en el botón', () => {
    usePermiso.mockImplementation((p) => p === 'ver_disciplinas' || p === 'ver_reservas');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    fireEvent.click(screen.getByText('Ver disciplinas inscriptas'));
    expect(screen.getByTestId('disciplinas-modal')).toBeInTheDocument();
  });

  test('abre el modal de reservas al hacer click en el botón', () => {
    usePermiso.mockImplementation((p) => p === 'ver_disciplinas' || p === 'ver_reservas');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    fireEvent.click(screen.getByText('Ver reservas activas'));
    expect(screen.getByTestId('reservas-modal')).toBeInTheDocument();
  });

  test('abre el modal de trámites al hacer click en el botón', () => {
    usePermiso.mockImplementation((p) => p === 'ver_tramites');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    fireEvent.click(screen.getByText('Ver trámites'));
    expect(screen.getByTestId('tramites-modal')).toBeInTheDocument();
  });

  test('cierra el modal de disciplinas al hacer click en Cerrar dentro del modal', () => {
    usePermiso.mockImplementation((p) => p === 'ver_disciplinas' || p === 'ver_reservas');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    fireEvent.click(screen.getByText('Ver disciplinas inscriptas'));
    fireEvent.click(screen.getByText('Cerrar disciplinas'));
    expect(screen.queryByTestId('disciplinas-modal')).not.toBeInTheDocument();
  });

  test('cierra el modal de trámites al hacer click en Cerrar dentro del modal', () => {
    usePermiso.mockImplementation((p) => p === 'ver_tramites');
    render(<SocioAccionesExtra idSocio="uuid-1" nroSocio="1001" />);
    fireEvent.click(screen.getByText('Ver trámites'));
    fireEvent.click(screen.getByText('Cerrar trámites'));
    expect(screen.queryByTestId('tramites-modal')).not.toBeInTheDocument();
  });
});
