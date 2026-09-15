import EmptyState from '../../components/feedback/EmptyState';
import './RankingList.css';

/** Lista de ranking genérica (posición + nombre + detalle + métrica), compartida por EventosTab y TiendaTab. */
function RankingList({ items, renderDetalle, renderMetrica, emptyMessage }) {
  if (!items || items.length === 0) {
    return <EmptyState mensaje={emptyMessage} />;
  }

  return (
    <div className="ranking-list-list">
      {items.map((item, i) => (
        <div key={item.id} className="ranking-list-item">
          <div className="ranking-list-position">{i + 1}</div>
          <div className="ranking-list-info">
            <span className="ranking-list-nombre">{item.nombre}</span>
            <span className="ranking-list-detalle">{renderDetalle(item)}</span>
          </div>
          <div className="ranking-list-metrica">{renderMetrica(item)}</div>
        </div>
      ))}
    </div>
  );
}

export default RankingList;
