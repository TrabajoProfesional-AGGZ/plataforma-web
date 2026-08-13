import { render, screen } from '@testing-library/react';
import RankingList from './RankingList';

test('muestra el mensaje vacío cuando no hay items', () => {
  render(<RankingList items={[]} emptyMessage="Nada por acá." renderDetalle={() => ''} renderMetrica={() => null} />);

  expect(screen.getByText('Nada por acá.')).toBeInTheDocument();
});

test('muestra el mensaje vacío cuando items es null', () => {
  render(<RankingList items={null} emptyMessage="Nada por acá." renderDetalle={() => ''} renderMetrica={() => null} />);

  expect(screen.getByText('Nada por acá.')).toBeInTheDocument();
});

test('renderiza posición, nombre, detalle y métrica de cada item', () => {
  const items = [
    { id: '1', nombre: 'Primero' },
    { id: '2', nombre: 'Segundo' },
  ];

  render(
    <RankingList
      items={items}
      emptyMessage="Nada por acá."
      renderDetalle={(item) => `detalle de ${item.nombre}`}
      renderMetrica={(item) => <span>metrica de {item.nombre}</span>}
    />
  );

  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('Primero')).toBeInTheDocument();
  expect(screen.getByText('Segundo')).toBeInTheDocument();
  expect(screen.getByText('detalle de Primero')).toBeInTheDocument();
  expect(screen.getByText('detalle de Segundo')).toBeInTheDocument();
  expect(screen.getAllByText(/metrica de/)).toHaveLength(2);
});
