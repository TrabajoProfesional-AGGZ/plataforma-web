import PropTypes from 'prop-types';
import './SkeletonRows.css';

/** Filas placeholder mientras carga una lista o card. Anuncia "Cargando" a lectores. */
export function SkeletonRows({ n = 5, altura = 46, ancho = '100%' }) {
  return (
    <div className="skeleton-rows" role="status" aria-label="Cargando">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton-row skeleton-pulse" style={{ height: altura, width: ancho }} />
      ))}
    </div>
  );
}

SkeletonRows.propTypes = {
  n: PropTypes.number,
  altura: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ancho: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
