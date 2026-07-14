import PropTypes from 'prop-types';
import { estadoConfig } from '../../utils/estadoConfig';
import { SocioAccionesExtra } from '../socioAccionesExtra/SocioAccionesExtra';
import { ModalOverlay } from '../createForm/ModalOverlay';
import '../../styles/SocioCard.css';
import '../../styles/ListDetailShared.css';

function VerSocioModal({ socio, onClose }) {
  const cfg = estadoConfig(socio.estado);
  const estadoNombre = typeof socio.estado === 'object' ? (socio.estado?.nombre ?? '') : (socio.estado ?? '');
  return (
    <ModalOverlay
      onClose={onClose}
      wrapperClass="ver-socio-modal-wrapper"
      ariaLabel={`Detalle de ${socio.apellido} ${socio.nombre}`}
    >
      <div className="socios-card">
        <button type="button" className="ver-socio-btn-x" aria-label="Cerrar" onClick={onClose}>×</button>
        <div className="socios-card-inner">
          <div className="detalle-logo-circle" style={{ '--estado-color': cfg.border }}>
            {socio.foto_url
              ? <img src={socio.foto_url} alt="" className="detalle-logo-img" referrerPolicy="no-referrer" />
              : <img src={cfg.logo} alt="" className="detalle-logo-img" />}
          </div>
          <div className="socios-card-data">
            <div className="detalle-card-data-header">
              <span className="detalle-full-name">{socio.apellido} {socio.nombre}</span>
              <span className="detalle-estado-badge" style={{ backgroundColor: cfg.bg, color: cfg.border, borderColor: cfg.border }}>
                {estadoNombre}
              </span>
            </div>
            <div className="socios-card-row">
              <span className="socios-card-label">N° Socio</span>
              <span>{socio.nro_socio}</span>
            </div>
            {socio.nro_documento && (
              <div className="socios-card-row">
                <span className="socios-card-label">DNI</span>
                <span>{socio.nro_documento}</span>
              </div>
            )}
            {socio.fecha_nacimiento && (
              <div className="socios-card-row">
                <span className="socios-card-label">Nacimiento</span>
                <span>{socio.fecha_nacimiento}</span>
              </div>
            )}
            {socio.email && (
              <div className="socios-card-row">
                <span className="socios-card-label">Email</span>
                <span>{socio.email}</span>
              </div>
            )}
            {socio.telefono && (
              <div className="socios-card-row">
                <span className="socios-card-label">Teléfono</span>
                <span>{socio.telefono}</span>
              </div>
            )}
            {socio.categoria && (
              <div className="socios-card-row">
                <span className="socios-card-label">Categoría</span>
                <span>{socio.categoria?.nombre ?? socio.categoria}</span>
              </div>
            )}
            {socio.id && socio.nro_socio && (
              <SocioAccionesExtra idSocio={String(socio.id)} nroSocio={String(socio.nro_socio)} />
            )}
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

VerSocioModal.propTypes = {
  socio: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nro_socio: PropTypes.string,
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    nro_documento: PropTypes.string,
    fecha_nacimiento: PropTypes.string,
    email: PropTypes.string,
    telefono: PropTypes.string,
    foto_url: PropTypes.string,
    categoria: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    estado: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export { VerSocioModal };
