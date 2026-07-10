import PropTypes from 'prop-types';
import { ModalOverlay } from '../createForm/ModalOverlay';

function SocioSubModal({ titulo, wrapperClass, onClose, children }) {
  return (
    <ModalOverlay onClose={onClose} wrapperClass={wrapperClass}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <h1>{titulo}</h1>
        </div>
        <div className="csf-card">
          {children}
        </div>
      </div>
    </ModalOverlay>
  );
}

SocioSubModal.propTypes = {
  titulo: PropTypes.string.isRequired,
  wrapperClass: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export { SocioSubModal };
