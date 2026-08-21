import PropTypes from 'prop-types';
import { PERMISO_LABELS } from '../../utils/permisoLabels';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import './PermisosModal.css';

/** Modal con la lista de permisos de un usuario, traducidos vía `PERMISO_LABELS`. */
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