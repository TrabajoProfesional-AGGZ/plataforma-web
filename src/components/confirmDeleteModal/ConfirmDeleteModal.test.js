import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    open: true,
    titulo: 'Eliminar elemento',
    mensaje: '¿Estás seguro de que querés eliminar este elemento?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no renderiza nada cuando open es false', () => {
    render(<ConfirmDeleteModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Eliminar elemento')).not.toBeInTheDocument();
  });

  test('renderiza el título y el mensaje cuando open es true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Eliminar elemento')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de que querés eliminar este elemento?')).toBeInTheDocument();
  });

  test('renderiza el subtítulo cuando se provee', () => {
    render(<ConfirmDeleteModal {...defaultProps} subtitulo="Socio N° 42" />);
    expect(screen.getByText('Socio N° 42')).toBeInTheDocument();
  });

  test('no renderiza subtítulo cuando no se provee', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.queryByText('Socio N° 42')).not.toBeInTheDocument();
  });

  test('llama a onCancel al hacer click en Cancelar', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onConfirm al hacer click en el botón de confirmar', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Eliminar'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al hacer click en el overlay', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const overlay = container.querySelector('.csf-overlay');
    fireEvent.click(overlay);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('no llama a onCancel al hacer click dentro del modal', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const wrapper = container.querySelector('.csf-wrapper');
    fireEvent.click(wrapper);
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  test('muestra labelConfirmar personalizado', () => {
    render(<ConfirmDeleteModal {...defaultProps} labelConfirmar="Pausar" />);
    expect(screen.getByText('Pausar')).toBeInTheDocument();
  });

  test('muestra labelGuardando cuando guardando es true', () => {
    render(<ConfirmDeleteModal {...defaultProps} guardando={true} labelGuardando="Eliminando..." />);
    expect(screen.getByText('Eliminando...')).toBeInTheDocument();
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  test('deshabilita el botón de confirmar cuando guardando es true', () => {
    render(<ConfirmDeleteModal {...defaultProps} guardando={true} labelGuardando="Eliminando..." />);
    expect(screen.getByText('Eliminando...')).toBeDisabled();
  });

  test('muestra el mensaje de error cuando errorModal tiene valor', () => {
    render(<ConfirmDeleteModal {...defaultProps} errorModal="Error al eliminar" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error al eliminar');
  });

  test('no muestra alerta de error cuando errorModal es null', () => {
    render(<ConfirmDeleteModal {...defaultProps} errorModal={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('llama a onCancel al presionar ESC en el overlay', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const overlay = container.querySelector('.csf-overlay');
    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onCancel al presionar Enter en el overlay', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const overlay = container.querySelector('.csf-overlay');
    fireEvent.keyDown(overlay, { key: 'Enter' });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
