import './RankingList.css';

function RankingList({ items, renderDetalle, renderMetrica, emptyMessage }) {
  if (!items || items.length === 0) {
    return <p className="ranking-list-empty">{emptyMessage}</p>;
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
