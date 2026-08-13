import { render, screen, fireEvent } from '@testing-library/react';
import MetricasPage from './MetricasPage';
import { usePermiso } from '../../hooks/usePermiso';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../hooks/usePermiso');

jest.mock('./ResumenTab', () => () => <div data-testid="panel-resumen">Panel Resumen</div>);
jest.mock('./FinanzasTab', () => () => <div data-testid="panel-finanzas">Panel Finanzas</div>);
jest.mock('./MorosidadTab', () => () => <div data-testid="panel-morosidad">Panel Morosidad</div>);
jest.mock('./EventosTab', () => () => <div data-testid="panel-eventos">Panel Eventos</div>);
jest.mock('./TiendaTab', () => () => <div data-testid="panel-tienda">Panel Tienda</div>);
jest.mock('./CajaTab', () => () => <div data-testid="panel-caja">Panel Caja</div>);

describe('MetricasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra mensaje de error de permisos si no tiene ver_metricas', () => {
    usePermiso.mockReturnValue(false);

    render(<MetricasPage />);

    expect(screen.getByText('Métricas')).toBeInTheDocument();
    expect(
      screen.getByText('No tenés los permisos necesarios para acceder a las métricas del club.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  test('muestra la pestaña Instalaciones activa por defecto', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    expect(screen.getByRole('tab', { name: 'Instalaciones' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('panel-resumen')).toBeInTheDocument();
    expect(screen.queryByTestId('panel-finanzas')).not.toBeInTheDocument();
  });

  test('click en la pestaña Finanzas muestra su panel', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    fireEvent.click(screen.getByRole('tab', { name: 'Finanzas' }));

    expect(screen.getByRole('tab', { name: 'Finanzas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('panel-finanzas')).toBeInTheDocument();
    expect(screen.queryByTestId('panel-resumen')).not.toBeInTheDocument();
  });

  test('click en la pestaña Morosidad muestra su panel', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    fireEvent.click(screen.getByRole('tab', { name: 'Morosidad' }));

    expect(screen.getByTestId('panel-morosidad')).toBeInTheDocument();
  });

  test('click en la pestaña Eventos muestra su panel', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    fireEvent.click(screen.getByRole('tab', { name: 'Eventos' }));

    expect(screen.getByTestId('panel-eventos')).toBeInTheDocument();
  });

  test('click en la pestaña Tienda muestra su panel', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    fireEvent.click(screen.getByRole('tab', { name: 'Tienda' }));

    expect(screen.getByTestId('panel-tienda')).toBeInTheDocument();
  });

  test('click en la pestaña Caja muestra su panel', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    fireEvent.click(screen.getByRole('tab', { name: 'Caja' }));

    expect(screen.getByTestId('panel-caja')).toBeInTheDocument();
  });

  test('la flecha derecha mueve la selección a la siguiente pestaña', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: 'Finanzas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('panel-finanzas')).toBeInTheDocument();
  });

  test('la flecha izquierda desde la primera pestaña vuelve a la última', () => {
    usePermiso.mockReturnValue(true);

    render(<MetricasPage />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

    expect(screen.getByRole('tab', { name: 'Caja' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('panel-caja')).toBeInTheDocument();
  });
});
