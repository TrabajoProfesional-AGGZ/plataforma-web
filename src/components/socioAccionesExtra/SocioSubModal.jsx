import { useEffect } from 'react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';

function SocioSubModal({ titulo, wrapperClass, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="csf-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.target === e.currentTarget && e.key === 'Escape') onClose(); }}
    >
      <div className={`csf-wrapper ${wrapperClass}`}>
        <div className="csf-outer-card">
          <div className="csf-header">
            <h1>{titulo}</h1>
          </div>
          <div className="csf-card">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

SocioSubModal.propTypes = {
  titulo: PropTypes.string.isRequired,
  wrapperClass: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export { SocioSubModal };
