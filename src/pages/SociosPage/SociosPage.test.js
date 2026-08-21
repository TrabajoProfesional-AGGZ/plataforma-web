import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import SociosPage from './SociosPage';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn(), logoSocio: 'logo.png', logoTexto: 'texto.png' }),
}));

jest.mock('../../firebase', () => ({ auth: {} }));

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../services/sociosService', () => ({
  getSocios: jest.fn(),
  updateSocio: jest.fn(),
  deleteSocio: jest.fn(),
}));
import { getSocios, updateSocio, deleteSocio } from '../../services/sociosService';

jest.mock('../../services/disciplinasService', () => ({
  getDisciplinas: jest.fn(),
  getSociosByDisciplina: jest.fn(),
  extenderSuscripcionDisciplina: jest.fn(),
  resolverListaEspera: jest.fn(),
}));
import {
  getDisciplinas,
  getSociosByDisciplina,
  extenderSuscripcionDisciplina,
  resolverListaEspera,
} from '../../services/disciplinasService';

jest.mock('../../components/createForm/CreateSocioForm', () => ({
  CreateSocioForm: ({ onSuccess, onCancel }) => (
    <div>
      <h1>Nuevo socio</h1>
      <button onClick={onSuccess}>Confirmar creación</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

jest.mock('../../components/editForm/EditSocioForm', () => ({
  EditSocioForm: ({ socio, onSuccess, onCancel }) => (
    <div>
      <h2>Editar socio</h2>
      <span>{socio.nombre}</span>
      <span>{socio.apellido}</span>
      <span>{socio.email}</span>
      <button onClick={() => onSuccess(socio)}>Confirmar edición</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

const socioMock = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nro_socio: '1001',
  nombre: 'Juan',
  apellido: 'Pérez',
  nro_documento: '12345678',
  fecha_nacimiento: '1990-01-01',
  email: 'juan@example.com',
  telefono: '11-2222-3333',
  categoria: { nombre: 'Activo' },
  estado: { nombre: 'Al día' },
};

const socioMock2 = {
  id: 'a1b2c3d4-0000-0000-0000-000000000002',
  nro_socio: '1002',
  nombre: 'María',
  apellido: 'García',
  nro_documento: '87654321',
  fecha_nacimiento: '1985-06-15',
  email: 'maria@example.com',
  telefono: null,
  categoria: { nombre: 'Senior' },
  estado: { nombre: 'Moroso' },
};

async function buscarYAbrirCard() {
  getSocios.mockResolvedValue([socioMock]);
  render(<SociosPage />);
  await waitFor(() => expect(getSocios).toHaveBeenCalled());
  fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), { target: { value: '1001' } });
  fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
  await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
  fireEvent.click(screen.getByText('1001'));
}

describe('SociosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSocios.mockResolvedValue([]);
    getDisciplinas.mockResolvedValue([]);
    getSociosByDisciplina.mockResolvedValue([]);
  });

  test('renderiza el título, el campo de búsqueda y los botones', async () => {
    render(<SociosPage />);
    expect(screen.getByRole('heading', { name: /socios/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por n° de socio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear socio/i })).toBeInTheDocument();
    await waitFor(() => expect(getSocios).toHaveBeenCalled());
  });

  test('el botón buscar está deshabilitado si el campo está vacío', async () => {
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  test('despliega el listado de socios al montar la página', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
  });

  test('muestra la card del socio al encontrarlo por N° de socio', async () => {
    await buscarYAbrirCard();
    await waitFor(() => {
      expect(screen.getByText('12345678')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('juan@example.com')).toBeInTheDocument();
      expect(screen.getByText('11-2222-3333')).toBeInTheDocument();
      expect(screen.getAllByText('Al día').length).toBeGreaterThan(0);
    });
  });

  test('la búsqueda muestra el socio encontrado en la tabla sin abrir la card', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
    expect(screen.queryByText('García')).not.toBeInTheDocument();
    expect(screen.queryByText('12345678')).not.toBeInTheDocument();
  });

  test('muestra botones de editar y eliminar en la card del socio', async () => {
    await buscarYAbrirCard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    });
  });

  test('muestra la foto de perfil del socio en la card cuando foto_url está presente', async () => {
    const socioConFoto = { ...socioMock, foto_url: 'https://res.cloudinary.com/foto.jpg' };
    getSocios.mockResolvedValue([socioConFoto]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const fila = screen.getByRole('button', { name: new RegExp(`ver detalle de ${socioConFoto.apellido} ${socioConFoto.nombre}`, 'i') });
    fireEvent.click(fila);

    await waitFor(() => {
      const img = document.querySelector('.detalle-logo-img');
      expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/foto.jpg');
      expect(img).toHaveAttribute('referrerPolicy', 'no-referrer');
    });
  });

  test('muestra mensaje de no encontrado cuando el N° de socio no existe en la lista', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '9999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se encontró ningún socio/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error ante un fallo inesperado en la búsqueda cuando no hay caché', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockRejectedValueOnce(new Error('Error al obtener socios'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al buscar el socio/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de servicio no disponible en la búsqueda cuando no hay caché', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/el servicio no está disponible/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de servicio no disponible en la carga inicial de socios', async () => {
    getSocios.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<SociosPage />);
    await waitFor(() => {
      expect(screen.getByText(/el servicio no está disponible/i)).toBeInTheDocument();
    });
  });

  test('muestra la lista de socios al hacer click en Ver todos', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  test('al hacer click en una fila de la tabla muestra la card del socio', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('1001'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    });
  });

  test('entrar al detalle de un socio mientras siguen llegando páginas del fetch en background no vuelve a la lista', async () => {
    const socioMock3 = { ...socioMock2, id: 'id3', nro_socio: '1003', nombre: 'Pedro', apellido: 'López', estado: { nombre: 'Al día' } };
    let onPageCb;
    let resolveGetSocios;
    getSocios.mockImplementation(({ onPage } = {}) => {
      onPageCb = onPage;
      return new Promise((resolve) => { resolveGetSocios = resolve; });
    });

    render(<SociosPage />);

    await waitFor(() => expect(onPageCb).toBeDefined());
    act(() => { onPageCb([socioMock, socioMock2]); });
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('1001'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    });

    act(() => { onPageCb([socioMock, socioMock2, socioMock3]); });
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await act(async () => { resolveGetSocios([socioMock, socioMock2, socioMock3]); });
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay socios registrados', async () => {
    render(<SociosPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay socios registrados/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error genérico en la carga inicial de socios', async () => {
    getSocios.mockRejectedValue(new Error('Error genérico'));
    render(<SociosPage />);
    await waitFor(() => {
      expect(screen.getByText(/error al obtener los socios/i)).toBeInTheDocument();
    });
  });

  test('hacer click en Ver todos usa la caché y no vuelve a llamar al servidor', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(getSocios).toHaveBeenCalledTimes(1);
  });

  // --- Modal crear ---

  test('abre y cierra el formulario de creación con el botón cancelar', async () => {
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /crear socio/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /crear socio/i }));
    expect(screen.getByRole('heading', { name: /nuevo socio/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('heading', { name: /nuevo socio/i })).not.toBeInTheDocument();
  });

  test('crear socio exitoso cierra el formulario y recarga la lista', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /crear socio/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /crear socio/i }));
    expect(screen.getByRole('heading', { name: /nuevo socio/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirmar creación/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /nuevo socio/i })).not.toBeInTheDocument();
      expect(getSocios).toHaveBeenCalledTimes(2);
    });
  });

  // --- Modal editar ---

  test('abre el formulario de edición con los datos del socio', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(screen.getByRole('heading', { name: /editar socio/i })).toBeInTheDocument();
    expect(screen.getAllByText('Juan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
  });

  test('editar socio exitoso actualiza la card y cierra el formulario', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar edición/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /editar socio/i })).not.toBeInTheDocument();
    });
  });

  // --- Modal eliminar ---

  test('abre el modal de confirmación de eliminación', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument();
    expect(screen.getByText(/eliminar al socio N°/i)).toBeInTheDocument();
  });

  test('eliminar socio exitoso vuelve al estado inicial', async () => {
    deleteSocio.mockResolvedValueOnce(undefined);
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    const modal = screen.getByRole('heading', { name: /eliminar socio/i }).closest('.csf-outer-card');
    fireEvent.click(within(modal).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(deleteSocio).toHaveBeenCalledWith(socioMock.id);
      expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
      expect(screen.queryByText('juan@example.com')).not.toBeInTheDocument();
    });
  });

  // --- Filtro por categoría ---

  test('muestra el botón Filtrar por en la vista de lista', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /filtrar por/i })).toBeInTheDocument();
  });

  test('al hacer click en Filtrar por aparecen los selectores de categoría y estado', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));

    expect(screen.getByDisplayValue('Categoría: Todas')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Estado: Todos')).toBeInTheDocument();
  });

  test('el selector de categoría muestra las opciones únicas disponibles', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));

    expect(screen.getByRole('option', { name: 'Activo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Senior' })).toBeInTheDocument();
  });

  test('filtrar por categoría muestra solo los socios de esa categoría', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Categoría: Todas'), { target: { value: 'Senior' } });

    expect(screen.getByText('García')).toBeInTheDocument();
    expect(screen.queryByText('Pérez')).not.toBeInTheDocument();
  });

  test('los filtros de categoría y estado se aplican en conjunto', async () => {
    const socioMock3 = { ...socioMock2, id: 'id3', nro_socio: '1003', nombre: 'Pedro', apellido: 'López', estado: { nombre: 'Al día' } };
    getSocios.mockResolvedValue([socioMock, socioMock2, socioMock3]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Categoría: Todas'), { target: { value: 'Senior' } });
    fireEvent.change(screen.getByDisplayValue('Estado: Todos'), { target: { value: 'Moroso' } });

    expect(screen.getByText('García')).toBeInTheDocument();
    expect(screen.queryByText('Pérez')).not.toBeInTheDocument();
    expect(screen.queryByText('López')).not.toBeInTheDocument();
  });

  test('los filtros se limpian al hacer click en Ver todos', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Categoría: Todas'), { target: { value: 'Senior' } });
    expect(screen.queryByText('Pérez')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));
    await waitFor(() => {
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.getByText('García')).toBeInTheDocument();
    });
  });

  // --- Filtro por disciplina (Feedback: se quitó la vista de socios inscriptos de Disciplinas) ---

  test('no muestra el selector de disciplina si no hay disciplinas cargadas', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));

    expect(screen.queryByDisplayValue('Disciplina: Todas')).not.toBeInTheDocument();
  });

  test('muestra el selector de disciplina cuando hay disciplinas cargadas', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));

    expect(screen.getByDisplayValue('Disciplina: Todas')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Natación' })).toBeInTheDocument();
  });

  test('filtrar por disciplina muestra solo los socios inscriptos en esa disciplina', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([{ id: socioMock.id, nro_socio: socioMock.nro_socio }]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });

    await waitFor(() => expect(getSociosByDisciplina).toHaveBeenCalledWith('disc-1'));
    await waitFor(() => {
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.queryByText('García')).not.toBeInTheDocument();
    });
  });

  test('muestra mensaje de error si falla la carga de socios de la disciplina', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockRejectedValueOnce(new Error('falla'));
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });

    await waitFor(() => {
      expect(screen.getByText(/no se pudieron obtener los socios de la disciplina/i)).toBeInTheDocument();
    });
  });

  test('muestra columna Suscripción con botón para extender al filtrar por disciplina', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([{ id: socioMock.id, nro_socio: socioMock.nro_socio }]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });

    await waitFor(() => expect(screen.getByText('Extender suscripcion')).toBeInTheDocument());
  });

  test('extiende la suscripción de un socio filtrado por disciplina sin abrir su detalle', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([{ id: socioMock.id, nro_socio: socioMock.nro_socio }]);
    extenderSuscripcionDisciplina.mockResolvedValueOnce({});
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });
    await waitFor(() => expect(screen.getByText('Extender suscripcion')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Extender suscripcion'));

    await waitFor(() => expect(screen.getByText('Suscripción extendida')).toBeInTheDocument());
    expect(extenderSuscripcionDisciplina).toHaveBeenCalledWith('disc-1', socioMock.id);
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  test('muestra error al fallar la extensión de suscripción desde el filtro de disciplina', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([{ id: socioMock.id, nro_socio: socioMock.nro_socio }]);
    extenderSuscripcionDisciplina.mockRejectedValueOnce(new Error('falla'));
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });
    await waitFor(() => expect(screen.getByText('Extender suscripcion')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Extender suscripcion'));

    await waitFor(() => expect(screen.getByText('Error, reintentar')).toBeInTheDocument());
  });

  test('el filtro de disciplina se limpia al hacer click en Ver todos', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([{ id: socioMock.id, nro_socio: socioMock.nro_socio }]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });
    await waitFor(() => expect(screen.queryByText('García')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.getByText('García')).toBeInTheDocument();
    });
  });

  test('un socio en_espera muestra el botón "Quitar de lista de espera" en vez de extender', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([
      { id: socioMock.id, nro_socio: socioMock.nro_socio, estado_suscripcion: 'en_espera' },
    ]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });

    expect(await screen.findByText('Quitar de lista de espera')).toBeInTheDocument();
    expect(screen.queryByText('Extender suscripcion')).not.toBeInTheDocument();
  });

  test('resolver la lista de espera a "activar" refresca la fila sin abrir el detalle del socio', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina
      .mockResolvedValueOnce([{ id: socioMock.id, nro_socio: socioMock.nro_socio, estado_suscripcion: 'en_espera' }])
      .mockResolvedValueOnce([{ id: socioMock.id, nro_socio: socioMock.nro_socio, estado_suscripcion: 'activa' }]);
    resolverListaEspera.mockResolvedValue({ estado_suscripcion: 'activa' });
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });
    fireEvent.click(await screen.findByText('Quitar de lista de espera'));

    fireEvent.click(await screen.findByRole('button', { name: 'Pasar inscripción a activa' }));

    await waitFor(() => {
      expect(resolverListaEspera).toHaveBeenCalledWith('disc-1', socioMock.id, 'activar');
      expect(getSociosByDisciplina).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  test('muestra error si falla la recarga de socios de la disciplina tras resolver la lista de espera', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina
      .mockResolvedValueOnce([{ id: socioMock.id, nro_socio: socioMock.nro_socio, estado_suscripcion: 'en_espera' }])
      .mockRejectedValueOnce(new Error('falla'));
    resolverListaEspera.mockResolvedValue({ estado_suscripcion: 'activa' });
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });
    fireEvent.click(await screen.findByText('Quitar de lista de espera'));

    fireEvent.click(await screen.findByRole('button', { name: 'Pasar inscripción a activa' }));

    await waitFor(() => {
      expect(screen.getByText(/no se pudieron obtener los socios de la disciplina/i)).toBeInTheDocument();
    });
  });

  test('cancelar el modal de lista de espera lo cierra sin llamar a resolverListaEspera', async () => {
    getSocios.mockResolvedValue([socioMock]);
    getDisciplinas.mockResolvedValue([{ id: 'disc-1', nombre: 'Natación' }]);
    getSociosByDisciplina.mockResolvedValue([
      { id: socioMock.id, nro_socio: socioMock.nro_socio, estado_suscripcion: 'en_espera' },
    ]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Disciplina: Todas'), { target: { value: 'disc-1' } });
    fireEvent.click(await screen.findByText('Quitar de lista de espera'));

    fireEvent.click(await screen.findByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Pasar inscripción a activa' })).not.toBeInTheDocument();
    });
    expect(resolverListaEspera).not.toHaveBeenCalled();
  });

  test('muestra error en modal al fallar la eliminación', async () => {
    deleteSocio.mockRejectedValueOnce(new Error('Error al eliminar socio'));
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    const modal = screen.getByRole('heading', { name: /eliminar socio/i }).closest('.csf-outer-card');
    fireEvent.click(within(modal).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('muestra error servicio no disponible al fallar la eliminación', async () => {
    deleteSocio.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    const modal = screen.getByRole('heading', { name: /eliminar socio/i }).closest('.csf-outer-card');
    fireEvent.click(within(modal).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // --- Cancelar modal eliminar ---

  test('cierra el modal de eliminación al hacer click en Cancelar', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminación al hacer click en el overlay', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument());

    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
  });

  // --- Cancelar edición ---

  test('cancelar edición cierra el formulario', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /editar socio/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByRole('heading', { name: /editar socio/i })).not.toBeInTheDocument();
  });

  // --- ESC cierra otros modales ---

  test('ESC cierra el modal de eliminación', async () => {
    await buscarYAbrirCard();
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
  });

  // --- Ordenamiento ---

  test('ordena la tabla al hacer click en el encabezado de columna', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const th = screen.getAllByRole('columnheader')[0];
    fireEvent.click(within(th).getByRole('button'));
    expect(screen.getAllByRole('button', { name: /ver detalle de/i }).length).toBeGreaterThan(0);
  });

  test('cicla entre asc, desc y sin orden al hacer click en el mismo encabezado', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    // El orden por defecto de la página de Socios ya es N° de Socio ascendente.
    const thNroSocio = screen.getAllByRole('columnheader')[0];
    expect(thNroSocio.textContent).toContain('↑');
    expect(thNroSocio).toHaveAttribute('aria-sort', 'ascending');
    const btnNroSocio = within(thNroSocio).getByRole('button');

    fireEvent.click(btnNroSocio);
    expect(thNroSocio.textContent).toContain('↓');
    expect(thNroSocio).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(btnNroSocio);
    expect(thNroSocio.textContent).toContain('↕');
    expect(thNroSocio).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(btnNroSocio);
    expect(thNroSocio.textContent).toContain('↑');
    expect(thNroSocio).toHaveAttribute('aria-sort', 'ascending');
  });

  test('ordena por columna con objetos anidados (estado)', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thEstado = screen.getAllByRole('columnheader')[4];
    fireEvent.click(within(thEstado).getByRole('button'));
    expect(screen.getAllByRole('button', { name: /ver detalle de/i }).length).toBeGreaterThan(0);
  });

  test('ordena la tabla al hacer click en los encabezados Apellido, Nombre y Categoría', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const headers = screen.getAllByRole('columnheader');

    fireEvent.click(within(headers[1]).getByRole('button'));
    expect(headers[1].textContent).toContain('↑');

    fireEvent.click(within(headers[2]).getByRole('button'));
    expect(headers[2].textContent).toContain('↑');

    fireEvent.click(within(headers[3]).getByRole('button'));
    expect(headers[3].textContent).toContain('↑');
  });

  test('aplica orden cuando dos socios tienen el mismo valor en la columna de ordenamiento', async () => {
    const socioMockIgual = { ...socioMock2, id: 'id-igual', nro_socio: '1003', nombre: 'Pedro', apellido: 'Lopez', categoria: { nombre: 'Activo' } };
    getSocios.mockResolvedValue([socioMock, socioMockIgual]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thCategoria = screen.getAllByRole('columnheader')[3];
    fireEvent.click(within(thCategoria).getByRole('button'));
    expect(screen.getAllByRole('button', { name: /ver detalle de/i }).length).toBeGreaterThan(0);
  });

  test('abre el detalle del socio al presionar Enter sobre la fila', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const fila = screen.getByRole('button', { name: new RegExp(`ver detalle de ${socioMock.apellido} ${socioMock.nombre}`, 'i') });
    fireEvent.keyDown(fila, { key: 'Enter' });
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());
  });

  // --- Búsqueda sin caché (ruta no-cache en handleBuscar) ---

  test('muestra el socio en la tabla al buscarlo cuando la caché está vacía', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockResolvedValueOnce([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
  });

  test('muestra no encontrado al buscar sin caché cuando el socio no existe', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockResolvedValueOnce([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '9999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se encontró ningún socio/i)).toBeInTheDocument();
    });
  });

  test('Ver todos cancela el timeout de búsqueda pendiente y muestra la lista', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    // buscarTimeoutRef.current queda pendiente (400ms), no ha disparado aún

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(getSocios).toHaveBeenCalledTimes(1);
  });

  test('Ver todos recarga del servidor cuando no hay caché', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockResolvedValueOnce([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(getSocios).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  test('Ver todos actualiza la tabla incrementalmente a medida que llegan páginas del reintento', async () => {
    let onPageCb;
    let resolveGetSocios;
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockImplementationOnce(({ onPage } = {}) => {
        onPageCb = onPage;
        return new Promise((resolve) => { resolveGetSocios = resolve; });
      });
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => expect(onPageCb).toBeDefined());
    act(() => { onPageCb([socioMock]); });
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());

    act(() => { onPageCb([socioMock, socioMock2]); });
    await waitFor(() => expect(screen.getByText('1002')).toBeInTheDocument());

    await act(async () => { resolveGetSocios([socioMock, socioMock2]); });
  });

  test('Ver todos muestra error de servicio no disponible cuando falla el reintento', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText(/el servicio no está disponible en este momento/i)).toBeInTheDocument();
    });
  });

  test('Ver todos muestra error genérico cuando falla el reintento con un error inesperado', async () => {
    getSocios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockRejectedValueOnce(new Error('otro error'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al obtener los socios\. intentá de nuevo\./i)).toBeInTheDocument();
    });
  });

  // --- Paginación ---

  function crearSocios(cantidad) {
    return Array.from({ length: cantidad }, (_, i) => ({
      id: `id-${i + 1}`,
      nro_socio: String(1000 + i + 1),
      nombre: `Nombre${i + 1}`,
      apellido: `Apellido${i + 1}`,
      nro_documento: '12345678',
      fecha_nacimiento: '1990-01-01',
      email: `socio${i + 1}@example.com`,
      telefono: null,
      categoria: { nombre: 'Activo' },
      estado: { nombre: 'Al día' },
    }));
  }

  test('no muestra controles de paginación cuando hay 10 socios o menos', async () => {
    getSocios.mockResolvedValue(crearSocios(10));
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    expect(screen.queryByLabelText(/paginación/i)).not.toBeInTheDocument();
  });

  test('muestra como máximo 10 filas por página y permite avanzar/retroceder', async () => {
    getSocios.mockResolvedValue(crearSocios(15));
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /ver detalle de/i })).toHaveLength(10);
    expect(screen.getByText('1001')).toBeInTheDocument();
    expect(screen.queryByText('1011')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /ver detalle de/i })).toHaveLength(5);
    expect(screen.getByText('1011')).toBeInTheDocument();
    expect(screen.queryByText('1001')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /página anterior/i }));
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('1001')).toBeInTheDocument();
  });

  test('la tabla por defecto está ordenada por N° de socio ascendente', async () => {
    const desordenados = [
      { ...crearSocios(1)[0], id: 'a', nro_socio: '1003' },
      { ...crearSocios(1)[0], id: 'b', nro_socio: '1001' },
      { ...crearSocios(1)[0], id: 'c', nro_socio: '1002' },
    ];
    getSocios.mockResolvedValue(desordenados);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const celdasNroSocio = screen
      .getAllByRole('button', { name: /ver detalle de/i })
      .map((fila) => fila.querySelector('td').textContent);
    expect(celdasNroSocio).toEqual(['1001', '1002', '1003']);
  });

  test('cambiar de filtro reinicia la paginación a la página 1', async () => {
    const socios = crearSocios(15).map((s, i) => ({
      ...s,
      estado: { nombre: i < 12 ? 'Al día' : 'Moroso' },
    }));
    getSocios.mockResolvedValue(socios);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByDisplayValue('Estado: Todos'), { target: { value: 'Moroso' } });

    await waitFor(() => {
      expect(screen.queryByLabelText(/paginación/i)).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /ver detalle de/i })).toHaveLength(3);
  });
});
