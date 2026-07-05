import { render, screen } from '@testing-library/react';
import { DesgloseFinanzasChart } from './DesgloseFinanzasChart';

// Mock de recharts para que no falle al intentar renderizar SVGs en JSDOM
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

describe('DesgloseFinanzasChart', () => {
  test('muestra un mensaje cuando no hay datos', () => {
    render(<DesgloseFinanzasChart datos={[]} />);
    expect(screen.getByText('No hay datos financieros para este período.')).toBeInTheDocument();
  });

  test('muestra un mensaje cuando datos es null', () => {
    render(<DesgloseFinanzasChart datos={null} />);
    expect(screen.getByText('No hay datos financieros para este período.')).toBeInTheDocument();
  });

  test('renderiza el gráfico cuando se proveen datos', () => {
    const datosMock = [
      { concepto: 'Cuota Social', monto: 1000 },
      { concepto: 'Alquileres', monto: 500 }
    ];

    render(<DesgloseFinanzasChart datos={datosMock} />);
    
    // Verificamos que el contenedor de Recharts esté en el documento
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Verificamos que el mensaje de "no hay datos" no exista
    expect(screen.queryByText('No hay datos financieros para este período.')).not.toBeInTheDocument();
  });
});