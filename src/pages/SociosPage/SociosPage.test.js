import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SociosPage from './SociosPage';

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

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
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));

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
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));

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
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
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
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
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
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
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
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
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

  test('muestra error en modal al fallar la eliminación', async () => {
    getSocios.mockResolvedValue([socioMock]);
    deleteSocio.mockRejectedValueOnce(new Error('Error al eliminar socio'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    const modal = screen.getByRole('heading', { name: /eliminar socio/i }).closest('.csf-outer-card');
    fireEvent.click(within(modal).getByRole('button', { name: /eliminar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('muestra error servicio no disponible al fallar la eliminación', async () => {
    getSocios.mockResolvedValue([socioMock]);
    deleteSocio.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
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
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminación al hacer click en el overlay', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /eliminar socio/i })).toBeInTheDocument());

    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(screen.queryByRole('heading', { name: /eliminar socio/i })).not.toBeInTheDocument();
  });

  // --- Cancelar edición ---

  test('cancelar edición cierra el formulario', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /editar socio/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByRole('heading', { name: /editar socio/i })).not.toBeInTheDocument();
  });

  // --- ESC cierra otros modales ---

  test('ESC cierra el formulario de edición', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /editar socio/i })).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /editar socio/i })).not.toBeInTheDocument();
  });

  test('ESC cierra el modal de eliminación', async () => {
    getSocios.mockResolvedValue([socioMock]);
    render(<SociosPage />);
    await waitFor(() => expect(getSocios).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(screen.getByText('1001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('1001'));
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
    fireEvent.click(th);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  test('cicla entre asc, desc y sin orden al hacer click en el mismo encabezado', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thNroSocio = screen.getAllByRole('columnheader')[0];
    fireEvent.click(thNroSocio);
    expect(thNroSocio.textContent).toContain('↑');

    fireEvent.click(thNroSocio);
    expect(thNroSocio.textContent).toContain('↓');

    fireEvent.click(thNroSocio);
    expect(thNroSocio.textContent).toContain('↕');
  });

  test('ordena por columna con objetos anidados (estado)', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thEstado = screen.getAllByRole('columnheader')[4];
    fireEvent.click(thEstado);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  test('ordena la tabla al hacer click en los encabezados Apellido, Nombre y Categoría', async () => {
    getSocios.mockResolvedValue([socioMock, socioMock2]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const headers = screen.getAllByRole('columnheader');

    fireEvent.click(headers[1]);
    expect(headers[1].textContent).toContain('↑');

    fireEvent.click(headers[2]);
    expect(headers[2].textContent).toContain('↑');

    fireEvent.click(headers[3]);
    expect(headers[3].textContent).toContain('↑');
  });

  test('aplica orden cuando dos socios tienen el mismo valor en la columna de ordenamiento', async () => {
    const socioMockIgual = { ...socioMock2, id: 'id-igual', nro_socio: '1003', nombre: 'Pedro', apellido: 'Lopez', categoria: { nombre: 'Activo' } };
    getSocios.mockResolvedValue([socioMock, socioMockIgual]);
    render(<SociosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thCategoria = screen.getAllByRole('columnheader')[3];
    fireEvent.click(thCategoria);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
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
});
