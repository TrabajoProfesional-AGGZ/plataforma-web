import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocioDisciplinasModal } from './SocioDisciplinasModal';
import { getDisciplinasBySocio } from '../../services/disciplinasService';

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

const onClose = jest.fn();

describe('SocioDisciplinasModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra el título correcto', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([]);
    render(<SocioDisciplinasModal idSocio="uuid-1" onClose={onClose} />);
    expect(screen.getByText('Disciplinas inscriptas')).toBeInTheDocument();
  });

  test('muestra mensaje vacío cuando el socio no tiene disciplinas', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([]);
    render(<SocioDisciplinasModal idSocio="uuid-1" onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByText('El socio no está inscripto en ninguna disciplina.')).toBeInTheDocument()
    );
  });

  test('muestra la lista de disciplinas cuando la carga es exitosa', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Pausada' } },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Natación')).toBeInTheDocument());
    expect(screen.getByText('Tenis')).toBeInTheDocument();
  });

  test('muestra el badge correcto para disciplinas activas y pausadas', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Pausada' } },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Activa')).toBeInTheDocument());
    expect(screen.getByText('Pausada')).toBeInTheDocument();
  });

  test('muestra un botón "Ver disciplina" por cada disciplina', async () => {
    getDisciplinasBySocio.mockResolvedValueOnce([
      { id: 'd-1', nombre: 'Natación', estado: { nombre: 'Activa' } },
      { id: 'd-2', nombre: 'Tenis', estado: { nombre: 'Activa' } },
    ]);
    render(<SocioDisciplinasModal idSocio="uuid-1" onClose={onClose} />);
    await waitFor(() => expect(screen.getAllByText('Ver disciplina')).toHaveLength(2));
  });

  test('muestra mensaje de error vacío cuando la carga falla', async () => {
    getDisciplinasBySocio.mockRejectedValueOnce(new Error('Error'));
    render(<SocioDisciplinasModal idSocio="uuid-1" onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByText('El socio no está inscripto en ninguna disciplina.')).toBeInTheDocument()
    );
  });
});
