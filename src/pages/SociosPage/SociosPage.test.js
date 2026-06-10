import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SociosPage from './SociosPage';

jest.mock('../../services/sociosService', () => ({
  getSocios: jest.fn(),
}));
import { getSocios } from '../../services/sociosService';

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
  });

  test('renderiza el título, el campo de búsqueda y los botones', () => {
    render(<SociosPage />);
    expect(screen.getByRole('heading', { name: /socios/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por n° de socio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver todos/i })).toBeInTheDocument();
  });

  test('el botón buscar está deshabilitado si el campo está vacío', () => {
    render(<SociosPage />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  test('muestra la card del socio al encontrarlo por N° de socio', async () => {
    getSocios.mockResolvedValueOnce([socioMock]);
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Pérez/)).toBeInTheDocument();
      expect(screen.getByText(/Juan/)).toBeInTheDocument();
      expect(screen.getByText('12345678')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('juan@example.com')).toBeInTheDocument();
      expect(screen.getByText('11-2222-3333')).toBeInTheDocument();
      expect(screen.getAllByText('Al día').length).toBeGreaterThan(0);
    });
    expect(getSocios).toHaveBeenCalled();
  });

  test('muestra mensaje de no encontrado cuando el N° de socio no existe en la lista', async () => {
    getSocios.mockResolvedValueOnce([socioMock]);
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '9999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se encontró ningún socio/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error ante un fallo inesperado en la búsqueda', async () => {
    getSocios.mockRejectedValueOnce(new Error('Error al obtener socios'));
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al buscar el socio/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de servicio no disponible cuando el backend devuelve 500 en búsqueda', async () => {
    getSocios.mockRejectedValueOnce(new Error('servicio-no-disponible'));
    render(<SociosPage />);

    fireEvent.change(screen.getByPlaceholderText(/buscar por n° de socio/i), {
      target: { value: '1001' },
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
      expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Juan').length).toBeGreaterThan(0);
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
