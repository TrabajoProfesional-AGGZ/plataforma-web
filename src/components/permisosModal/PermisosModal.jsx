import { useEffect } from 'react';
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
    <div className="csf-overlay" onClick={onClose}>
      <div className="csf-wrapper permisos-modal-wrapper" onClick={(e) => e.stopPropagation()}>
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

export { PermisosModal };
