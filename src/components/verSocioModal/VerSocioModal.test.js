import { render, screen, fireEvent } from '@testing-library/react';
import { VerSocioModal } from './VerSocioModal';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../assets/logo-verde.png', () => 'logo-verde.png');
jest.mock('../../assets/logo-rojo.png', () => 'logo-rojo.png');
jest.mock('../../assets/logo-amarillo.png', () => 'logo-amarillo.png');
jest.mock('../../assets/logo-naranja.png', () => 'logo-naranja.png');
jest.mock('../socioAccionesExtra/SocioAccionesExtra', () => ({
  SocioAccionesExtra: () => null,
}));

const socioBase = {
  id: 'uuid-1',
  nro_socio: '42',
  nombre: 'Juan',
  apellido: 'Pérez',
  estado: 'Activo',
};

describe('VerSocioModal', () => {
  const onClose = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  test('muestra el N° de socio, apellido y nombre', () => {
    render(<VerSocioModal socio={socioBase} onClose={onClose} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Pérez Juan')).toBeInTheDocument();
  });

  test('llama a onClose al hacer clic en el botón ×', () => {
    render(<VerSocioModal socio={socioBase} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('llama a onClose al hacer clic en el overlay', () => {
    const { container } = render(<VerSocioModal socio={socioBase} onClose={onClose} />);
    const overlay = container.querySelector('.csf-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('no llama a onClose al hacer clic dentro del card', () => {
    render(<VerSocioModal socio={socioBase} onClose={onClose} />);
    fireEvent.click(screen.getByText('Pérez Juan'));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('llama a onClose al presionar ESC', () => {
    render(<VerSocioModal socio={socioBase} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('muestra campos opcionales cuando están presentes', () => {
    const completo = {
      ...socioBase,
      nro_documento: '12345678',
      fecha_nacimiento: '1990-01-01',
      email: 'juan@example.com',
      telefono: '1122334455',
      categoria: { nombre: 'Adulto' },
    };
    render(<VerSocioModal socio={completo} onClose={onClose} />);
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('1990-01-01')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.getByText('1122334455')).toBeInTheDocument();
    expect(screen.getByText('Adulto')).toBeInTheDocument();
  });

  test('no muestra campos opcionales cuando no están presentes', () => {
    const minimo = { nombre: 'Pedro', apellido: 'García', estado: 'Activo' };
    render(<VerSocioModal socio={minimo} onClose={onClose} />);
    expect(screen.queryByText('DNI')).not.toBeInTheDocument();
    expect(screen.queryByText('Teléfono')).not.toBeInTheDocument();
  });

  test('muestra categoría y estado como string cuando no son objetos', () => {
    const s = { ...socioBase, categoria: 'Adulto', estado: 'Moroso' };
    render(<VerSocioModal socio={s} onClose={onClose} />);
    expect(screen.getByText('Adulto')).toBeInTheDocument();
    expect(screen.getByText('Moroso')).toBeInTheDocument();
  });

  test('muestra la foto de perfil del socio cuando foto_url está presente', () => {
    const conFoto = { ...socioBase, foto_url: 'https://res.cloudinary.com/foto.jpg' };
    const { container } = render(<VerSocioModal socio={conFoto} onClose={onClose} />);
    const img = container.querySelector('.detalle-logo-img');
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/foto.jpg');
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer');
  });
});
