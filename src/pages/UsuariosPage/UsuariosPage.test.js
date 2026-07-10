import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import UsuariosPage from './UsuariosPage';

jest.mock('../../hooks/usePermiso', () => ({
  usePermiso: () => true,
}));

jest.mock('../../context/AuthContext', () => ({
  useAuthContext: jest.fn(() => ({ userData: { usuario_id: 'uuid-9999' } })),
}));
import { useAuthContext } from '../../context/AuthContext';

jest.mock('../../services/usuariosService', () => ({
  fetchUsuarios: jest.fn(),
  eliminarUsuario: jest.fn(),
  cambiarRolUsuario: jest.fn(),
}));
import { fetchUsuarios, eliminarUsuario, cambiarRolUsuario } from '../../services/usuariosService';

jest.mock('../../services/rolesService', () => ({
  fetchRoles: jest.fn(),
}));
import { fetchRoles } from '../../services/rolesService';

jest.mock('../../components/createUserForm/CreateUserForm', () => ({
  CreateUserForm: ({ onSuccess, onCancel }) => (
    <div>
      <h1>Nuevo usuario</h1>
      <button onClick={onSuccess}>Confirmar creación</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

jest.mock('../../components/editUserForm/EditUserForm', () => ({
  EditUserForm: ({ usuario, onSuccess, onCancel }) => (
    <div>
      <h2>Editar usuario</h2>
      <span data-testid="edit-nombre">{usuario.nombre}</span>
      <button onClick={() => onSuccess(usuario)}>Confirmar edición</button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

jest.mock('../../components/cambiarRolForm/CambiarRolForm', () => ({
  CambiarRolForm: ({ usuario, onSuccess, onCancel }) => (
    <div>
      <h2>Cambiar rol</h2>
      <span data-testid="cambiar-rol-usuario">{usuario.nombre}</span>
      <button onClick={() => onSuccess({ ...usuario, rol: { nombre: 'PRESIDENTE', permisos: [] } })}>
        Confirmar cambio de rol
      </button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

jest.mock('../../components/permisosModal/PermisosModal', () => ({
  PermisosModal: ({ permisos, onClose }) => ( // NOSONAR
    <div>
      <h2>Permisos</h2>
      <ul>{permisos.map((p) => <li key={p}>{p}</li>)}</ul> {/* NOSONAR */}
      <button onClick={onClose}>Cerrar</button>
    </div>
  ),
}));

const usuarioMock = {
  id: 'uuid-0001',
  firebase_uid: 'firebase-uid-1',
  nombre: 'Carlos',
  apellido: 'Rodríguez',
  email: 'carlos@club.com',
  fecha_nacimiento: '1985-03-20',
  rol: { nombre: 'ADMIN', permisos: [{ id: 1, nombre: 'ver_socios' }, { id: 2, nombre: 'editar_socios' }] },
  estado: { nombre: 'Activo' },
};

const usuarioMock2 = {
  id: 'uuid-0002',
  firebase_uid: 'firebase-uid-2',
  nombre: 'Laura',
  apellido: 'Sánchez',
  email: 'laura@club.com',
  fecha_nacimiento: '1990-07-15',
  rol: { nombre: 'PRESIDENTE', permisos: [{ id: 1, nombre: 'ver_socios' }] },
  estado: { nombre: 'Activo' },
};

const rolesMock = [
  { id: 1, nombre: 'ADMIN', permisos: [] },
  { id: 2, nombre: 'PRESIDENTE', permisos: [] },
];

async function renderYAbrirCardUsuario() {
  fetchUsuarios.mockResolvedValue([usuarioMock]);
  render(<UsuariosPage />);
  await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Rodríguez'));
  await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());
}

describe('UsuariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchUsuarios.mockResolvedValue([]);
    fetchRoles.mockResolvedValue(rolesMock);
    useAuthContext.mockReturnValue({ userData: { usuario_id: 'uuid-9999' } });
  });

  test('renderiza el título, el campo de búsqueda y los botones', async () => {
    render(<UsuariosPage />);
    expect(screen.getByRole('heading', { name: /consultar usuarios/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por nombre/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear usuario/i })).toBeInTheDocument();
    await waitFor(() => expect(fetchUsuarios).toHaveBeenCalled());
  });

  test('el botón buscar está deshabilitado si el campo está vacío', async () => {
    render(<UsuariosPage />);
    await waitFor(() => expect(fetchUsuarios).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  test('carga y muestra el listado de usuarios al montar la página', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getAllByText('Rodríguez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carlos').length).toBeGreaterThan(0);
  });

  test('muestra mensaje cuando no hay usuarios registrados', async () => {
    render(<UsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText(/no hay usuarios registrados/i)).toBeInTheDocument();
    });
  });

  test('muestra error cuando el servicio no está disponible', async () => {
    fetchUsuarios.mockRejectedValue(new Error('servicio-no-disponible'));
    render(<UsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText(/el servicio no está disponible/i)).toBeInTheDocument();
    });
  });

  test('al hacer click en una fila muestra la card con datos del usuario', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Rodríguez'));

    await waitFor(() => {
      expect(screen.getByText('carlos@club.com')).toBeInTheDocument();
      expect(screen.getAllByText('ADMIN').length).toBeGreaterThan(0);
    });
  });

  test('muestra los botones Editar, Cambiar rol y Eliminar en la card', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Rodríguez'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cambiar rol/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    });
  });

  // --- Búsqueda client-side ---

  test('filtra usuarios por texto de búsqueda', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), {
      target: { value: 'laura' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => expect(screen.getAllByText('Sánchez').length).toBeGreaterThan(0));
    expect(screen.queryByText('Rodríguez')).not.toBeInTheDocument();
  });

  test('hacer click en Ver todos usa la caché y no vuelve a llamar al servidor', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(fetchUsuarios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(fetchUsuarios).toHaveBeenCalledTimes(1);
  });

  test('Ver todos limpia el filtro y muestra la lista completa', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), {
      target: { value: 'laura' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Rodríguez').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sánchez').length).toBeGreaterThan(0);
    });
  });

  // --- Filtro por rol ---

  test('aparece el botón Filtrar por en la lista', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /filtrar por/i })).toBeInTheDocument();
  });

  test('al clickear Filtrar por aparece el dropdown de rol', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('filtrar por rol muestra solo los usuarios de ese rol', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /filtrar por/i }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PRESIDENTE' } });

    expect(screen.getAllByText('Sánchez').length).toBeGreaterThan(0);
    expect(screen.queryByText('Rodríguez')).not.toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay usuarios con los filtros seleccionados', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), {
      target: { value: 'zzznombreinexistente' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no hay usuarios con los filtros seleccionados/i)).toBeInTheDocument();
    });
  });

  // --- Modal crear ---

  test('abre y cierra el formulario de creación', async () => {
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /crear usuario/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));
    expect(screen.getByRole('heading', { name: /nuevo usuario/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('heading', { name: /nuevo usuario/i })).not.toBeInTheDocument();
  });

  test('cierra el formulario de creación con ESC', async () => {
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /crear usuario/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));
    expect(screen.getByRole('heading', { name: /nuevo usuario/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /nuevo usuario/i })).not.toBeInTheDocument();
  });

  test('crear usuario exitoso cierra el formulario y recarga la lista', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /crear usuario/i })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar creación/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /nuevo usuario/i })).not.toBeInTheDocument();
      expect(fetchUsuarios).toHaveBeenCalledTimes(2);
    });
  });

  // --- Modal editar ---

  test('abre el formulario de edición con los datos del usuario', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument();
      expect(screen.getByTestId('edit-nombre')).toHaveTextContent('Carlos');
    });
  });

  test('editar usuario exitoso cierra el modal', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /confirmar edición/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /editar usuario/i })).not.toBeInTheDocument();
    });
  });

  // --- Modal eliminar ---

  test('abre el modal de confirmación de eliminación', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Rodríguez/)).toBeInTheDocument();
  });

  test('eliminar usuario exitoso recarga la lista', async () => {
    eliminarUsuario.mockResolvedValue();
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument());

    const botonesEliminar = screen.getAllByRole('button', { name: /^eliminar$/i });
    fireEvent.click(botonesEliminar[botonesEliminar.length - 1]);

    await waitFor(() => {
      expect(eliminarUsuario).toHaveBeenCalledWith(usuarioMock.id);
      expect(fetchUsuarios).toHaveBeenCalledTimes(2);
    });
  });

  test('muestra error en el modal si falla la eliminación', async () => {
    eliminarUsuario.mockRejectedValue(new Error('servicio-no-disponible'));
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument());

    const botonesEliminar = screen.getAllByRole('button', { name: /^eliminar$/i });
    fireEvent.click(botonesEliminar[botonesEliminar.length - 1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // --- CambiarRolForm ---

  test('abre el formulario de cambio de rol', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /cambiar rol/i }));

    expect(screen.getByRole('heading', { name: /cambiar rol/i })).toBeInTheDocument();
    expect(screen.getByTestId('cambiar-rol-usuario')).toHaveTextContent('Carlos');
  });

  test('cambiar rol exitoso cierra el formulario y actualiza la card', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /cambiar rol/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /cambiar rol/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /confirmar cambio de rol/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /cambiar rol/i })).not.toBeInTheDocument();
    });
  });

  test('cancelar cambio de rol cierra el formulario', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /cambiar rol/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /cambiar rol/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(screen.queryByRole('heading', { name: /cambiar rol/i })).not.toBeInTheDocument();
  });

  // --- Errores genéricos ---

  test('muestra error genérico cuando la carga de usuarios falla', async () => {
    fetchUsuarios.mockRejectedValue(new Error('error-desconocido'));
    render(<UsuariosPage />);
    await waitFor(() => {
      expect(screen.getByText(/error al obtener los usuarios/i)).toBeInTheDocument();
    });
  });

  test('muestra error genérico si falla la eliminación', async () => {
    eliminarUsuario.mockRejectedValue(new Error('error-desconocido'));
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument());

    const botonesEliminar = screen.getAllByRole('button', { name: /^eliminar$/i });
    fireEvent.click(botonesEliminar[botonesEliminar.length - 1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // --- Cancelar modal eliminar ---

  test('cierra el modal de eliminación al hacer click en Cancelar', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByText(/eliminar usuario/i)).not.toBeInTheDocument();
  });

  test('cierra el modal de eliminación al hacer click en el overlay', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument());

    fireEvent.click(document.querySelector('.csf-overlay'));
    expect(screen.queryByText(/eliminar usuario/i)).not.toBeInTheDocument();
  });

  // --- Cancelar edición ---

  test('cancelar edición cierra el formulario', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(screen.queryByRole('heading', { name: /editar usuario/i })).not.toBeInTheDocument();
  });

  // --- Ordenamiento ---

  test('ordena la tabla al hacer click en el encabezado de columna', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const th = screen.getAllByRole('columnheader')[0];
    fireEvent.click(within(th).getByRole('button'));
    expect(screen.getAllByRole('button', { name: /ver detalle de/i }).length).toBeGreaterThan(0);
  });

  test('cicla entre asc, desc y sin orden al hacer click en el mismo encabezado', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thApellido = screen.getAllByRole('columnheader')[0];
    const btnApellido = within(thApellido).getByRole('button');
    fireEvent.click(btnApellido);
    expect(thApellido.textContent).toContain('↑');
    expect(thApellido).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(btnApellido);
    expect(thApellido.textContent).toContain('↓');
    expect(thApellido).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(btnApellido);
    expect(thApellido.textContent).toContain('↕');
    expect(thApellido).toHaveAttribute('aria-sort', 'none');
  });

  test('ordena la tabla al hacer click en los encabezados Nombre, Email, Rol y Estado', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const headers = screen.getAllByRole('columnheader');

    fireEvent.click(within(headers[1]).getByRole('button'));
    expect(headers[1].textContent).toContain('↑');

    fireEvent.click(within(headers[2]).getByRole('button'));
    expect(headers[2].textContent).toContain('↑');

    fireEvent.click(within(headers[3]).getByRole('button'));
    expect(headers[3].textContent).toContain('↑');

    fireEvent.click(within(headers[4]).getByRole('button'));
    expect(headers[4].textContent).toContain('↑');
  });

  test('aplica orden cuando dos usuarios tienen el mismo estado', async () => {
    // Ambos usuarios tienen estado.nombre = 'Activo', lo que dispara el return 0 en aplicarOrden
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const thEstado = screen.getAllByRole('columnheader')[4];
    fireEvent.click(within(thEstado).getByRole('button'));
    expect(screen.getAllByRole('button', { name: /ver detalle de/i }).length).toBeGreaterThan(0);
  });

  test('abre el detalle del usuario al presionar Enter sobre la fila', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock, usuarioMock2]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const fila = screen.getAllByRole('button', { name: /ver detalle de/i })[0];
    fireEvent.keyDown(fila, { key: 'Enter' });
    await waitFor(() => expect(screen.getByRole('button', { name: /^editar$/i })).toBeInTheDocument());
  });

  test('Ver todos recarga del servidor cuando no hay caché', async () => {
    fetchUsuarios
      .mockRejectedValueOnce(new Error('fallo inicial'))
      .mockResolvedValueOnce([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(fetchUsuarios).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(fetchUsuarios).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  // --- ESC cierra otros modales ---

  test('ESC cierra el modal de edición', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /editar usuario/i })).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /editar usuario/i })).not.toBeInTheDocument();
  });

  test('ESC cierra el modal de eliminación', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    await waitFor(() => expect(screen.getByText(/eliminar usuario/i)).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/eliminar usuario/i)).not.toBeInTheDocument();
  });

  test('ESC cierra el modal de cambiar rol', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /cambiar rol/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /cambiar rol/i })).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /cambiar rol/i })).not.toBeInTheDocument();
  });

  // --- Modal de permisos ---

  test('muestra el botón Ver permisos cuando el usuario tiene permisos', async () => {
    await renderYAbrirCardUsuario();
    expect(screen.getByRole('button', { name: /ver permisos/i })).toBeInTheDocument();
  });

  test('abre el modal de permisos al hacer click en Ver permisos', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /ver permisos/i }));
    expect(screen.getByRole('heading', { name: /permisos/i })).toBeInTheDocument();
  });

  test('cierra el modal de permisos al llamar onClose', async () => {
    await renderYAbrirCardUsuario();
    fireEvent.click(screen.getByRole('button', { name: /ver permisos/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /permisos/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(screen.queryByRole('heading', { name: /permisos/i })).not.toBeInTheDocument();
  });

  // --- Auto-edición de permisos ---

  test('no muestra el botón Cambiar rol cuando el usuario seleccionado es el usuario logueado', async () => {
    useAuthContext.mockReturnValue({ userData: { usuario_id: 'uuid-0001' } });
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Rodríguez'));

    await waitFor(() => expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /cambiar rol/i })).not.toBeInTheDocument();
  });

  test('muestra el botón Cambiar rol cuando el usuario seleccionado no es el usuario logueado', async () => {
    fetchUsuarios.mockResolvedValue([usuarioMock]);
    render(<UsuariosPage />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Rodríguez'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cambiar rol/i })).toBeInTheDocument();
    });
  });
});
