import PropTypes from 'prop-types';
import './EmptyState.css';

function EmptyState({ mensaje }) {
  return <p className="empty-state">{mensaje}</p>;
}

EmptyState.propTypes = {
  mensaje: PropTypes.string.isRequired,
};

export default EmptyState;
