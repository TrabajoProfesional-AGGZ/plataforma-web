import PropTypes from 'prop-types';
import { PERMISO_LABELS } from '../../utils/permisoLabels';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import './PermisosModal.css';

function PermisosModal({ permisos, onClose }) {
  return (
    <SocioSubModal titulo="Permisos" wrapperClass="permisos-modal-wrapper" onClose={onClose}>
      <ul className="permisos-lista-scroll">
        {permisos.map((p) => (
          <li key={p} className="permisos-lista-item">
            {PERMISO_LABELS[p] ?? p}
          </li>
        ))}
      </ul>
    </SocioSubModal>
  );
}

PermisosModal.propTypes = {
  permisos: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};

export { PermisosModal };