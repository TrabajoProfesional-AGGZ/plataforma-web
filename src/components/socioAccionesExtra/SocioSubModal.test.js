import { render, screen, fireEvent } from '@testing-library/react';
import { SocioSubModal } from './SocioSubModal';

describe('SocioSubModal', () => {
  const onClose = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  test('renderiza el título y el contenido hijo', () => {
    render(
      <SocioSubModal titulo="Mi título" wrapperClass="test-class" onClose={onClose}>
        <p>Contenido hijo</p>
      </SocioSubModal>
    );
    expect(screen.getByText('Mi título')).toBeInTheDocument();
    expect(screen.getByText('Contenido hijo')).toBeInTheDocument();
  });

  test('llama a onClose al presionar ESC', () => {
    render(
      <SocioSubModal titulo="Test" wrapperClass="test-class" onClose={onClose}>
        <p>Hijo</p>
      </SocioSubModal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('llama a onClose al hacer clic en el overlay', () => {
    const { container } = render(
      <SocioSubModal titulo="Test" wrapperClass="test-class" onClose={onClose}>
        <p>Hijo</p>
      </SocioSubModal>
    );
    const overlay = container.querySelector('.csf-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('no llama a onClose al hacer clic dentro del dialog', () => {
    render(
      <SocioSubModal titulo="Test" wrapperClass="test-class" onClose={onClose}>
        <p>Hijo</p>
      </SocioSubModal>
    );
    fireEvent.click(screen.getByText('Hijo'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
