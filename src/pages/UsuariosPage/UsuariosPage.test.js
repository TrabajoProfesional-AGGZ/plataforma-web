import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import UsuariosPage from './UsuariosPage';
import * as usuariosService from '../../services/usuariosService';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../services/usuariosService');

const mockUsuarios = [
  { uid: 'uid1', email: 'admin@club.com', role: 'admin' },
  { uid: 'uid2', email: 'super@club.com', role: 'superAdmin' },
];

describe('UsuariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra estado de carga al inicio', () => {
    usuariosService.getUsers.mockReturnValue(new Promise(() => {}));
    render(<UsuariosPage />);
    expect(screen.getByText(/cargando usuarios/i)).toBeInTheDocument();
  });

  test('muestra la tabla de usuarios cuando la carga es exitosa', async () => {
    usuariosService.getUsers.mockResolvedValueOnce(mockUsuarios);
    render(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText('admin@club.com')).toBeInTheDocument();
      expect(screen.getByText('super@club.com')).toBeInTheDocument();
    });
  });

  test('muestra banner de error cuando getUsers falla sin crashear', async () => {
    usuariosService.getUsers.mockRejectedValueOnce(new Error('Network error'));
    render(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no se pudieron cargar/i);
    });
  });

  test('botón de usuario admin dice "Promover a superAdmin"', async () => {
    usuariosService.getUsers.mockResolvedValueOnce(mockUsuarios);
    render(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /promover a superAdmin/i })).toBeInTheDocument();
    });
  });

  test('botón de usuario superAdmin dice "Degradar a admin"', async () => {
    usuariosService.getUsers.mockResolvedValueOnce(mockUsuarios);
    render(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /degradar a admin/i })).toBeInTheDocument();
    });
  });

  test('al cambiar rol llama a updateUserRole con el rol opuesto', async () => {
    usuariosService.getUsers.mockResolvedValueOnce(mockUsuarios);
    usuariosService.updateUserRole.mockResolvedValueOnce();
    render(<UsuariosPage />);

    await waitFor(() => screen.getByRole('button', { name: /promover a superAdmin/i }));
    fireEvent.click(screen.getByRole('button', { name: /promover a superAdmin/i }));

    await waitFor(() => {
      expect(usuariosService.updateUserRole).toHaveBeenCalledWith('uid1', 'superAdmin');
    });
  });

  describe('modal de creación de usuario', () => {
    beforeEach(() => {
      usuariosService.getUsers.mockResolvedValue(mockUsuarios);
    });

    async function abrirModal() {
      render(<UsuariosPage />);
      await waitFor(() => screen.getByRole('button', { name: /crear usuario/i }));
      fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));
    }

    test('el modal no se muestra al cargar la página', async () => {
      render(<UsuariosPage />);
      await waitFor(() => screen.getByText('admin@club.com'));
      expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
    });

    test('el modal se abre al hacer click en "Crear usuario"', async () => {
      await abrirModal();
      expect(screen.getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument();
    });

    test('el modal se cierra al hacer click en "Cancelar"', async () => {
      await abrirModal();
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
    });

    test('el modal se cierra al presionar ESC', async () => {
      await abrirModal();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
    });

    test('el modal se cierra al hacer click fuera de él', async () => {
      await abrirModal();
      fireEvent.click(screen.getByRole('heading', { name: /crear usuario/i }).closest('.modal-overlay'));
      expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
    });

    test('al crear exitosamente se cierra el modal y se recargan los usuarios', async () => {
      usuariosService.createUser.mockResolvedValueOnce({ uid: 'uid3' });
      usuariosService.getUsers.mockResolvedValue(mockUsuarios);
      await abrirModal();

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nuevo@club.com' } });
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass123' } });
      fireEvent.submit(screen.getByRole('button', { name: /^crear$/i }).closest('form'));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
      });
      expect(usuariosService.createUser).toHaveBeenCalledWith('nuevo@club.com', 'pass123', 'admin');
      expect(usuariosService.getUsers).toHaveBeenCalledTimes(2);
    });

    test('al fallar la creación muestra el mensaje de error sin cerrar el modal', async () => {
      usuariosService.createUser.mockRejectedValueOnce(new Error('Error al crear usuario'));
      await abrirModal();

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@x.com' } });
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass' } });
      fireEvent.submit(screen.getByRole('button', { name: /^crear$/i }).closest('form'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo crear el usuario/i);
      });
      expect(screen.getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument();
    });
  });
});
