import { render, screen, fireEvent } from '@testing-library/react';
import { FormFooterActions } from './FormFooterActions';

describe('FormFooterActions', () => {
  test('llama a onCancel al hacer click en Cancelar', () => {
    const onCancel = jest.fn();
    render(<FormFooterActions onCancel={onCancel} onSubmit={jest.fn()} submitLabel="Confirmar" />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('llama a onSubmit al hacer click en el botón de submit', () => {
    const onSubmit = jest.fn();
    render(<FormFooterActions onCancel={jest.fn()} onSubmit={onSubmit} submitLabel="Confirmar" />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('muestra submitLabel cuando no está cargando', () => {
    render(<FormFooterActions onCancel={jest.fn()} onSubmit={jest.fn()} submitLabel="Crear compra" />);
    expect(screen.getByRole('button', { name: 'Crear compra' })).toBeInTheDocument();
  });

  test('muestra el label de carga por defecto mientras loading es true', () => {
    render(<FormFooterActions onCancel={jest.fn()} onSubmit={jest.fn()} submitLabel="Crear compra" loading />);
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  test('acepta un label de carga personalizado', () => {
    render(
      <FormFooterActions
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
        submitLabel="Crear compra"
        loading
        loadingLabel="Procesando..."
      />
    );
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
  });

  test('deshabilita el botón de submit cuando disabled es true', () => {
    render(<FormFooterActions onCancel={jest.fn()} onSubmit={jest.fn()} submitLabel="Confirmar" disabled />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
  });
});
