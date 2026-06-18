import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { PERMISO_LABELS } from '../../utils/permisoLabels';
import '../createForm/CreateSocioForm.css';
import './PermisosModal.css';

function PermisosModal({ permisos, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <button
      type="button"
      className="csf-overlay"
      aria-label="Cerrar"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); }}
    >
      <div role="dialog" aria-modal="true" className="csf-wrapper permisos-modal-wrapper" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
    </button>
  );
}

PermisosModal.propTypes = {
  permisos: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};

export { PermisosModal };
