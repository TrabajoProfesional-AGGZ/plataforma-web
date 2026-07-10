import { AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import './ErrorBanner.css';

function ErrorBanner({ mensaje, onReintentar }) {
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{mensaje}</span>
      {onReintentar && (
        <button type="button" className="error-banner-btn" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

ErrorBanner.propTypes = {
  mensaje: PropTypes.string.isRequired,
  onReintentar: PropTypes.func,
};

export default ErrorBanner;
