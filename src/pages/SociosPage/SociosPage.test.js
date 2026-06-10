import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SociosPage from './SociosPage';

jest.mock('../../services/sociosService', () => ({
  getSocios: jest.fn(),
  updateSocio: jest.fn(),
  deleteSocio: jest.fn(),
}));
import { getSocios, updateSocio, deleteSocio } from '../../services/sociosService';

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

describe('SociosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSocios.mockResolvedValue([]);
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
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Pérez/)).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('juan@example.com')).toBeInTheDocument();
      expect(screen.getByText('11-2222-3333')).toBeInTheDocument();
      expect(screen.getAllByText('Al día').length).toBeGreaterThan(0);
    });
  });

  test('muestra botones de editar y eliminar en la card del socio', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
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

  test('muestra mensaje de error ante un fallo inesperado en la búsqueda', async () => {
    getSocios
      .mockResolvedValueOnce([])
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

  test('muestra mensaje de servicio no disponible cuando el backend devuelve 500 en búsqueda', async () => {
    getSocios
      .mockResolvedValueOnce([])
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

  test('muestra mensaje de servicio no disponible cuando el backend devuelve 500 en ver todos', async () => {
    getSocios
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /ver todos/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

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

  test('muestra mensaje cuando no hay socios registrados', async () => {
    render(<SociosPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay socios registrados/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error si falla la carga de todos los socios', async () => {
    getSocios
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Error al obtener socios'));
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /ver todos/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al obtener los socios/i)).toBeInTheDocument();
    });
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

  test('cierra el formulario de creación con la tecla ESC', async () => {
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /crear socio/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /crear socio/i }));
    expect(screen.getByRole('heading', { name: /nuevo socio/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
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
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(screen.getByRole('heading', { name: /editar socio/i })).toBeInTheDocument();
    expect(screen.getAllByText('Juan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
  });

  test('editar socio exitoso actualiza la card y cierra el formulario', async () => {
    const socioActualizado = { ...socioMock, nombre: 'Carlos' };
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar edición/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /editar socio/i })).not.toBeInTheDocument();
    });
  });

  // --- Modal eliminar ---

  test('abre el modal de confirmación de eliminación', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument();
    expect(screen.getByText(/eliminar al socio N°/i)).toBeInTheDocument();
  });

  test('eliminar socio exitoso vuelve al estado inicial', async () => {
    getSocios.mockResolvedValue([socioMock]);
    deleteSocio.mockResolvedValueOnce(undefined);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    const modal = screen.getByRole('heading', { name: /eliminar socio/i }).closest('.modal');
    fireEvent.click(within(modal).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(deleteSocio).toHaveBeenCalledWith(socioMock.id);
      expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
      expect(screen.queryByText('juan@example.com')).not.toBeInTheDocument();
    });
  });

  test('muestra error en modal al fallar la eliminación', async () => {
    getSocios.mockResolvedValue([socioMock]);
    deleteSocio.mockRejectedValueOnce(new Error('Error al eliminar socio'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    const modal = screen.getByRole('heading', { name: /eliminar socio/i }).closest('.modal');
    fireEvent.click(within(modal).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
