import PropTypes from 'prop-types';
import './EmptyState.css';

/** Mensaje de texto para mostrar cuando un listado no tiene resultados. */
function EmptyState({ mensaje }) {
  return <p className="empty-state">{mensaje}</p>;
}

EmptyState.propTypes = {
  mensaje: PropTypes.string.isRequired,
};

export default EmptyState;
