import { render, screen, fireEvent } from '@testing-library/react';
import { DetailHeader } from './DetailHeader';

describe('DetailHeader', () => {
  test('muestra el título como encabezado y llama a onBack al hacer click en Volver', () => {
    const onBack = jest.fn();
    render(<DetailHeader onBack={onBack} titulo="Fútbol 5" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Fútbol 5' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('muestra subtítulo, badge de estado y acciones cuando se pasan', () => {
    render(
      <DetailHeader
        onBack={() => {}}
        titulo="Cancha 1"
        subtitulo="Sede central"
        estado={<span>Activa</span>}
        acciones={<button type="button">Eliminar</button>}
      />
    );

    expect(screen.getByText('Sede central')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  test('sin título solo muestra el botón Volver (detalle cargando o con error)', () => {
    render(<DetailHeader onBack={() => {}} titulo={null} acciones={<button type="button">Editar</button>} />);

    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  test('renderiza children debajo del encabezado', () => {
    render(
      <DetailHeader onBack={() => {}} titulo="Remera">
        <p>Contenido extra</p>
      </DetailHeader>
    );

    expect(screen.getByText('Contenido extra')).toBeInTheDocument();
  });
});
