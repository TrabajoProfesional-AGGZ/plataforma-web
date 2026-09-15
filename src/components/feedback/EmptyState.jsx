import PropTypes from 'prop-types';
import './EmptyState.css';

/** Mensaje de texto para mostrar cuando un listado no tiene resultados. */
function EmptyState({ mensaje, accion }) {
  return (
    <div className="empty-state">
      <p className="empty-state-mensaje">{mensaje}</p>
      {accion}
    </div>
  );
}

EmptyState.propTypes = {
  mensaje: PropTypes.string.isRequired,
  accion: PropTypes.node,
};

export default EmptyState;
