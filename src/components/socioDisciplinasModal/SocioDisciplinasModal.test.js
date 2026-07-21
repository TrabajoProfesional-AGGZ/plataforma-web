import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocioDisciplinasModal } from './SocioDisciplinasModal';
import { getDisciplinasBySocio } from '../../services/disciplinasService';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/disciplinasService');
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
jest.mock('../resolverListaEsperaModal/ResolverListaEsperaModal', () => ({
  ResolverListaEsperaModal: ({ idDisciplina, nombreSocio, onSuccess, onCancel }) => (
    <div data-testid="resolver-modal">
      <span>Resolver {nombreSocio} en {idDisciplina}</span>
      <button onClick={onSuccess}>Confirmar resolución</button>
      <button onClick={onCancel}>Cancelar resolución</button>
    </div>
  ),
}));

const onClose = jest.fn();

describe('SocioDisciplinasModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título correcto', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);
    expect(screen.getByText('Disciplinas inscriptas')).toBeInTheDocument();
  });

  test('muestra mensaje vacío cuando el socio no tiene disciplinas', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByText('El socio no está inscripto en ninguna disciplina.')).toBeInTheDocument()
    );
  });

  test('muestra la lista de disciplinas cuando la carga es exitosa', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Pausada' } },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Natación')).toBeInTheDocument());
    expect(screen.getByText('Tenis')).toBeInTheDocument();
  });

  test('muestra el badge correcto para disciplinas activas y pausadas', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Pausada' } },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Activa')).toBeInTheDocument());
    expect(screen.getByText('Pausada')).toBeInTheDocument();
  });

  test('muestra un botón "Ver disciplina" por cada disciplina', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Activa' } },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);
    await waitFor(() => expect(screen.getAllByText('Ver disciplina')).toHaveLength(2));
  });

  test('muestra mensaje de error vacío cuando la carga falla', async () => {
    getDisciplinasBySocio.mockRejectedValueOnce(new Error('Error'));
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByText('El socio no está inscripto en ninguna disciplina.')).toBeInTheDocument()
    );
  });

  test('muestra el botón "Revisar" en vez de "Ver disciplina" para una disciplina en_espera', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' }, estado_suscripcion: 'activa' },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Activa' }, estado_suscripcion: 'en_espera' },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);

    await waitFor(() => expect(screen.getAllByText('Ver disciplina')).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeInTheDocument();
  });

  test('abre ResolverListaEsperaModal al hacer click en "Revisar" y refresca la lista al resolver', async () => {
    getDisciplinasBySocio
      .mockResolvedValueOnce([
        { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Activa' }, estado_suscripcion: 'en_espera' },
      ])
      .mockResolvedValueOnce([
        { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Activa' }, estado_suscripcion: 'activa' },
      ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Revisar' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Revisar' }));

    expect(screen.getByTestId('resolver-modal')).toBeInTheDocument();
    expect(screen.getByText('Resolver Ana Gómez en d-2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirmar resolución'));

    await waitFor(() => {
      expect(screen.queryByTestId('resolver-modal')).not.toBeInTheDocument();
      expect(getDisciplinasBySocio).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument();
    expect(screen.getByText('Ver disciplina')).toBeInTheDocument();
  });

  test('cancelar ResolverListaEsperaModal lo cierra sin refrescar la lista', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Activa' }, estado_suscripcion: 'en_espera' },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" nombreSocio="Ana Gómez" onClose={onClose} />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Revisar' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Revisar' }));
    fireEvent.click(screen.getByText('Cancelar resolución'));

    expect(screen.queryByTestId('resolver-modal')).not.toBeInTheDocument();
    expect(getDisciplinasBySocio).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeInTheDocument();
  });
});
