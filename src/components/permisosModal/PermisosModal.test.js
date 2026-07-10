import { render, screen, fireEvent } from '@testing-library/react';
import { PermisosModal } from './PermisosModal';

jest.mock('../../firebase', () => ({ auth: {} }));

const onClose = jest.fn();

describe('PermisosModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra etiquetas legibles para todos los permisos', () => {
    render(<PermisosModal permisos={['ver_socios', 'crear_usuario']} onClose={onClose} />);
    expect(screen.getByText('Ver socios')).toBeInTheDocument();
    expect(screen.getByText('Crear usuario')).toBeInTheDocument();
  });

  test('muestra el nombre técnico como fallback para permisos desconocidos', () => {
    render(<PermisosModal permisos={['permiso_desconocido']} onClose={onClose} />);
    expect(screen.getByText('permiso_desconocido')).toBeInTheDocument();
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
