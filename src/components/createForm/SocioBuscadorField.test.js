import { render, screen, fireEvent } from '@testing-library/react';
import { SocioBuscadorField } from './SocioBuscadorField';

function renderCampo(props = {}) {
  const onChange = jest.fn();
  const onBlurPreview = jest.fn();
  const onBuscar = jest.fn();
  render(
    <SocioBuscadorField
      nroSocioInput=""
      busquedaSocio={false}
      errorSocio=""
      socioSeleccionado={null}
      onChange={onChange}
      onBlurPreview={onBlurPreview}
      onBuscar={onBuscar}
      {...props}
    />
  );
  return { onChange, onBlurPreview, onBuscar };
}

describe('SocioBuscadorField', () => {
  test('llama a onChange al escribir en el input', () => {
    const { onChange } = renderCampo();
    fireEvent.change(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    expect(onChange).toHaveBeenCalledWith('1234');
  });

  test('llama a onBlurPreview al perder el foco', () => {
    const { onBlurPreview } = renderCampo({ nroSocioInput: '1234' });
    fireEvent.blur(screen.getByPlaceholderText(/ej\. 1234/i), { target: { value: '1234' } });
    expect(onBlurPreview).toHaveBeenCalledWith('1234');
  });

  test('llama a onBuscar al presionar Enter', () => {
    const { onBuscar } = renderCampo({ nroSocioInput: '1234' });
    fireEvent.keyDown(screen.getByPlaceholderText(/ej\. 1234/i), { key: 'Enter' });
    expect(onBuscar).toHaveBeenCalledTimes(1);
  });

  test('otras teclas no disparan la búsqueda', () => {
    const { onBuscar } = renderCampo({ nroSocioInput: '1234' });
    fireEvent.keyDown(screen.getByPlaceholderText(/ej\. 1234/i), { key: 'a' });
    expect(onBuscar).not.toHaveBeenCalled();
  });

  test('el botón Buscar está deshabilitado sin input o mientras busca', () => {
    renderCampo({ nroSocioInput: '' });
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  test('llama a onBuscar al hacer click en el botón Buscar', () => {
    const { onBuscar } = renderCampo({ nroSocioInput: '1234' });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onBuscar).toHaveBeenCalledTimes(1);
  });

  test('muestra el nombre del socio seleccionado', () => {
    renderCampo({ socioSeleccionado: { nombre: 'Juan', apellido: 'García' } });
    expect(screen.getByText(/García/)).toBeInTheDocument();
    expect(screen.getByText(/Juan/)).toBeInTheDocument();
  });

  test('muestra el error de búsqueda', () => {
    renderCampo({ errorSocio: 'No se encontró ningún socio con ese número.' });
    expect(screen.getByText('No se encontró ningún socio con ese número.')).toBeInTheDocument();
  });
});
