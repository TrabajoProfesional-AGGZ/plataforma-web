import { render, screen } from '@testing-library/react';
import { TendenciasPagoChart } from './TendenciasPagoChart';

// Mock de recharts para que no falle al intentar renderizar SVGs en JSDOM
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ tickFormatter }) => {
    if (tickFormatter) tickFormatter(50);
    return <div data-testid="y-axis">mock-y-axis</div>;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: ({ formatter }) => {
    if (formatter) formatter(50.4321);
    return <div data-testid="tooltip">mock-tooltip</div>;
  },
}));

describe('TendenciasPagoChart', () => {
  test('muestra un mensaje cuando no hay datos', () => {
    render(<TendenciasPagoChart datos={[]} />);
    expect(screen.getByText('No hay datos de tendencias de pago para este rango.')).toBeInTheDocument();
  });

  test('muestra un mensaje cuando datos es null', () => {
    render(<TendenciasPagoChart datos={null} />);
    expect(screen.getByText('No hay datos de tendencias de pago para este rango.')).toBeInTheDocument();
  });

  test('renderiza el gráfico cuando se proveen datos', () => {
    const datosMock = [
      { mes: '2026-06', a_termino: 80, fuera_de_termino: 20 },
      { mes: '2026-07', a_termino: 90, fuera_de_termino: 10 },
    ];

    render(<TendenciasPagoChart datos={datosMock} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.queryByText('No hay datos de tendencias de pago para este rango.')).not.toBeInTheDocument();
  });

  test('no rompe cuando un mes no tiene pagos (total 0)', () => {
    const datosMock = [{ mes: '2026-06', a_termino: 0, fuera_de_termino: 0 }];
    render(<TendenciasPagoChart datos={datosMock} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('no rompe cuando faltan los campos a_termino/fuera_de_termino', () => {
    const datosMock = [{ mes: '2026-06' }];
    render(<TendenciasPagoChart datos={datosMock} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('ejecuta los formatters del eje Y y el tooltip', () => {
    const datosMock = [{ mes: '2026-06', a_termino: 80, fuera_de_termino: 20 }];
    render(<TendenciasPagoChart datos={datosMock} />);
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
