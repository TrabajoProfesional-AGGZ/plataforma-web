import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
});
