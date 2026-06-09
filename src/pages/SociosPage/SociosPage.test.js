import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SociosPage from './SociosPage';

jest.mock('../../services/sociosService', () => ({
  getSocios: jest.fn(),
  getSocioPorDni: jest.fn(),
}));
import { getSocios, getSocioPorDni } from '../../services/sociosService';

const socioMock = {
  id_socio: '106998',
  nombre: 'Juan',
  apellido: 'Pérez',
  categoria: 'Activo',
  estado: 'Al día',
};

describe('SociosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el título, el campo de búsqueda y los botones', () => {
    render(<SociosPage />);
    expect(screen.getByRole('heading', { name: /socios/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por dni/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver todos/i })).toBeInTheDocument();
  });

  test('el botón buscar está deshabilitado si el campo está vacío', () => {
    render(<SociosPage />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  test('muestra el resultado al encontrar un socio por DNI', async () => {
    getSocioPorDni.mockResolvedValueOnce(socioMock);
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por dni/i), {
      target: { value: '12345678' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getAllByText('Al día').length).toBeGreaterThan(0);
    });
    expect(getSocioPorDni).toHaveBeenCalledWith('12345678');
  });

  test('muestra mensaje de no encontrado cuando el DNI no existe', async () => {
    getSocioPorDni.mockRejectedValueOnce(new Error('no-encontrado'));
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por dni/i), {
      target: { value: '99999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se encontró ningún socio/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error ante un fallo inesperado en la búsqueda', async () => {
    getSocioPorDni.mockRejectedValueOnce(new Error('Error al obtener socio'));
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por dni/i), {
      target: { value: '12345678' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al buscar el socio/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de servicio no disponible cuando el backend devuelve 500 en búsqueda', async () => {
    getSocioPorDni.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por dni/i), {
      target: { value: '12345678' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/el servicio no está disponible/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de servicio no disponible cuando el backend devuelve 500 en ver todos', async () => {
    getSocios.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText(/el servicio no está disponible/i)).toBeInTheDocument();
    });
  });

  test('muestra la lista de socios al hacer click en Ver todos', async () => {
    getSocios.mockResolvedValueOnce([socioMock]);
    render(<SociosPage />);

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(getSocios).toHaveBeenCalled();
  });

  test('muestra mensaje cuando no hay socios registrados', async () => {
    getSocios.mockResolvedValueOnce([]);
    render(<SociosPage />);

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText(/no hay socios registrados/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error si falla la carga de todos los socios', async () => {
    getSocios.mockRejectedValueOnce(new Error('Error al obtener socios'));
    render(<SociosPage />);

    fireEvent.click(screen.getByRole('button', { name: /ver todos/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al obtener los socios/i)).toBeInTheDocument();
    });
  });
});
