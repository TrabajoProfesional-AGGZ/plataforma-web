import PropTypes from 'prop-types';
import { estadoConfig } from '../../utils/estadoConfig';
import { SocioAccionesExtra } from '../socioAccionesExtra/SocioAccionesExtra';
import '../../styles/SocioCard.css';

function VerSocioModal({ socio, onClose }) {
  const cfg = estadoConfig(socio.estado);
  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.target === e.currentTarget && e.key === 'Escape') onClose(); }}
    >
      <div className="ver-socio-modal-wrapper">
        <button type="button" className="ver-socio-btn-x" onClick={onClose}>×</button>
        <div className="socios-card" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
          <div className="socios-card-inner">
            <img src={cfg.logo} alt="" className="socios-card-logo" />
            <div className="socios-card-data">
              <div className="socios-card-row">
                <span className="socios-card-label">N° Socio</span>
                <span>{socio.nro_socio}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Apellido y nombre</span>
                <span>{socio.apellido} {socio.nombre}</span>
              </div>
              {socio.nro_documento && (
                <div className="socios-card-row">
                  <span className="socios-card-label">DNI</span>
                  <span>{socio.nro_documento}</span>
                </div>
              )}
              {socio.fecha_nacimiento && (
                <div className="socios-card-row">
                  <span className="socios-card-label">Fecha de nacimiento</span>
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
              {socio.estado && (
                <div className="socios-card-row">
                  <span className="socios-card-label">Estado</span>
                  <span>{socio.estado?.nombre ?? socio.estado}</span>
                </div>
              )}
              {socio.id && socio.nro_socio && (
                <SocioAccionesExtra idSocio={String(socio.id)} nroSocio={String(socio.nro_socio)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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
    categoria: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    estado: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export { VerSocioModal };
