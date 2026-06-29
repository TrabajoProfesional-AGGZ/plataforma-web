import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { PERMISO_LABELS } from '../../utils/permisoLabels';
import '../createForm/CreateSocioForm.css';
import './PermisosModal.css';

function PermisosModal({ permisos, onClose }) {
  // Este useEffect está perfecto. Garantiza que el ESC funcione 
  // incluso si el usuario no tiene el foco en el modal.
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Escape' || e.key === 'Enter')) onClose();
      }}
    >
      <div className="csf-wrapper permisos-modal-wrapper">
        <div className="csf-outer-card">
          <div className="csf-header">
            <h1>Permisos</h1>
          </div>
          <div className="csf-card">
            <ul className="permisos-lista-scroll">
              {permisos.map((p) => (
                <li key={p} className="permisos-lista-item">
                  {PERMISO_LABELS[p] ?? p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

PermisosModal.propTypes = {
  permisos: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};

export { PermisosModal };