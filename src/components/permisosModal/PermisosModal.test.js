import { render, screen, fireEvent } from '@testing-library/react';
import { PermisosModal } from './PermisosModal';

jest.mock('../../firebase', () => ({ auth: {} }));

const onClose = jest.fn();

describe('PermisosModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra etiquetas legibles para todos los permisos (expandiendo cada módulo)', () => {
    render(<PermisosModal permisos={['ver_socios', 'crear_usuario']} onClose={onClose} />);
    expect(screen.getByText('Ver socios')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /usuarios/i }));
    expect(screen.getByText('Crear usuario')).toBeInTheDocument();
  });

  test('muestra el nombre técnico como fallback para permisos desconocidos', () => {
    render(<PermisosModal permisos={['permiso_desconocido']} onClose={onClose} />);
    expect(screen.getByText('permiso_desconocido')).toBeInTheDocument();
  });

  test('agrupa los permisos por módulo, con el título del módulo como encabezado de la fila', () => {
    render(<PermisosModal permisos={['ver_socios', 'crear_socio', 'ver_usuarios']} onClose={onClose} />);

    const tituloSocios = screen.getByText('Socios');
    const tituloUsuarios = screen.getByText('Usuarios');
    expect(tituloSocios).toBeInTheDocument();
    expect(tituloUsuarios).toBeInTheDocument();

    const filaSocios = tituloSocios.closest('.permisos-fila');
    expect(filaSocios).toContainElement(screen.getByText('Ver socios'));
    expect(filaSocios).toContainElement(screen.getByText('Crear socio'));

    fireEvent.click(screen.getByRole('button', { name: /usuarios/i }));
    const filaUsuarios = tituloUsuarios.closest('.permisos-fila');
    expect(filaUsuarios).toContainElement(screen.getByText('Ver usuarios'));
  });

  test('solo el primer módulo está expandido por defecto; hace click para expandir/colapsar otro', () => {
    render(<PermisosModal permisos={['ver_socios', 'ver_usuarios']} onClose={onClose} />);

    expect(screen.getByText('Ver socios')).toBeInTheDocument();
    expect(screen.queryByText('Ver usuarios')).not.toBeInTheDocument();

    const headerUsuarios = screen.getByRole('button', { name: /usuarios/i });
    expect(headerUsuarios).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(headerUsuarios);
    expect(headerUsuarios).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ver usuarios')).toBeInTheDocument();

    fireEvent.click(headerUsuarios);
    expect(headerUsuarios).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Ver usuarios')).not.toBeInTheDocument();
  });

  test('con 4 módulos o menos no muestra controles de paginación', () => {
    render(
      <PermisosModal
        permisos={['ver_socios', 'ver_usuarios', 'ver_reservas', 'ver_instalaciones']}
        onClose={onClose}
      />
    );
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument();
  });

  test('con más de 4 módulos pagina de a 4 filas y permite avanzar/retroceder', () => {
    const permisos = [
      'ver_socios', 'ver_usuarios', 'ver_reservas', 'ver_instalaciones', 'ver_disciplinas', 'ver_noticias',
    ];
    const { container } = render(<PermisosModal permisos={permisos} onClose={onClose} />);

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(container.querySelectorAll('.permisos-fila')).toHaveLength(4);
    expect(screen.queryByText('Noticias')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /página siguiente/i }));

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('Noticias')).toBeInTheDocument();
    expect(screen.queryByText('Socios')).not.toBeInTheDocument();
  });

  test('llama a onClose al presionar ESC', () => {
    render(<PermisosModal permisos={['ver_socios']} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('llama a onClose al hacer click en el overlay', () => {
    render(<PermisosModal permisos={['ver_socios']} onClose={onClose} />);
    fireEvent.click(screen.getByRole('heading', { name: /permisos/i }).closest('.csf-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('no llama a onClose al hacer click dentro del modal', () => {
    render(<PermisosModal permisos={['ver_socios']} onClose={onClose} />);
    fireEvent.click(screen.getByRole('heading', { name: /permisos/i }));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('Enter en el overlay no cierra el modal', () => {
    const { container } = render(<PermisosModal permisos={['ver_socios']} onClose={onClose} />);
    const overlay = container.querySelector('.csf-overlay');
    fireEvent.keyDown(overlay, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
