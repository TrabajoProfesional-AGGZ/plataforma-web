import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import PropTypes from 'prop-types';
import { getTramitesPorSocio, getTramite } from '../../services/tramitesService';
import { TramiteReviewModal } from '../tramiteReviewModal/TramiteReviewModal';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import EstadoBadge from '../badge/EstadoBadge';
import { urlImagenSegura } from '../../utils/utils';
import { handleActivateKey } from '../../utils/a11y';
import { useTheme } from '../../hooks/useTheme';
import './SocioTramitesModal.css';

const ESTADO_VARIANT = {
  en_revision: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
};

const ESTADO_LABEL = {
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

function esImagen(url) {
  return /\.(jpe?g|png|webp)(\?|$)/i.test(url ?? '');
}

function esUrlSegura(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function SocioTramitesModal({ idSocio, onClose }) {
  const { logoSocio: logo } = useTheme();
  const [vista, setVista] = useState('lista');
  const [tramites, setTramites] = useState([]);
  const [tramiteActual, setTramiteActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const handleClose = useCallback(onClose, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getTramitesPorSocio(idSocio)
      .then(setTramites)
      .catch(() => setTramites([]))
      .finally(() => setLoading(false));
  }, [idSocio]);

  async function handleClickTramite(t) {
    setVista('detalle');
    setLoadingDetalle(true);
    setErrorDetalle('');
    try {
      const detalle = await getTramite(t.id);
      setTramiteActual(detalle);
    } catch {
      setErrorDetalle('No se pudo cargar el trámite.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  function handleVolver() {
    setVista('lista');
    setTramiteActual(null);
    setErrorDetalle('');
  }

  function handleReviewed(actualizado) {
    setReviewOpen(false);
    setTramiteActual(actualizado);
    setTramites((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
  }

  const imagenArchivo = tramiteActual && esImagen(tramiteActual.archivo_url)
    ? urlImagenSegura(tramiteActual.archivo_url)
    : null;

  function renderArchivo() {
    if (imagenArchivo) {
      return (
        <img
          src={imagenArchivo}
          alt="Archivo del trámite"
          className="socio-tramites-imagen"
          referrerPolicy="no-referrer"
        />
      );
    }

    if (esUrlSegura(tramiteActual.archivo_url)) {
      return (
        <a
          href={tramiteActual.archivo_url}
          target="_blank"
          rel="noreferrer"
          className="socio-tramites-link-archivo"
        >
          Ver archivo
        </a>
      );
    }

    return <span className="csf-hint">Enlace no válido</span>;
  }

  return (
    <SocioSubModal
      titulo="Trámites"
      wrapperClass="socio-tramites-wrapper"
      onClose={reviewOpen ? () => {} : handleClose}
    >
      {vista === 'lista' && (
        loading ? (
          <div className="socio-modal-loading">
            <img src={logo} alt="" className="loading-logo" />
          </div>
        ) : tramites.length === 0 ? (
          <p className="socio-modal-empty">El socio no tiene trámites cargados.</p>
        ) : (
          <ul className="socio-modal-lista">
            {tramites.map((t) => (
              <li
                key={t.id}
                className="socio-modal-item socio-tramites-item"
                role="button"
                tabIndex={0}
                aria-label={`Ver detalle de ${t.tipo_tramite.nombre}`}
                onClick={() => handleClickTramite(t)}
                onKeyDown={handleActivateKey(() => handleClickTramite(t))}
              >
                <div className="socio-modal-item-info socio-tramites-info">
                  <span className="socio-modal-item-nombre">{t.tipo_tramite.nombre}</span>
                  <span className="socio-tramites-fecha">{t.fecha_carga?.slice(0, 10)}</span>
                </div>
                <EstadoBadge variant={ESTADO_VARIANT[t.estado] ?? 'neutral'}>
                  {ESTADO_LABEL[t.estado] ?? t.estado}
                </EstadoBadge>
              </li>
            ))}
          </ul>
        )
      )}

      {vista === 'detalle' && (
        <div className="socio-tramites-detalle">
          <button type="button" className="socio-tramites-btn-volver" onClick={handleVolver}>
            <ChevronLeft size={16} aria-hidden="true" />
            Volver
          </button>

          {loadingDetalle && (
            <div className="socio-modal-loading">
              <img src={logo} alt="" className="loading-logo" />
            </div>
          )}

          {errorDetalle && !loadingDetalle && (
            <p className="socio-modal-empty">{errorDetalle}</p>
          )}

          {!loadingDetalle && !errorDetalle && tramiteActual && (
            <div className="socio-tramites-detalle-info">
              <h2 className="socio-tramites-detalle-titulo">{tramiteActual.tipo_tramite.nombre}</h2>
              <EstadoBadge variant={ESTADO_VARIANT[tramiteActual.estado] ?? 'neutral'}>
                {ESTADO_LABEL[tramiteActual.estado] ?? tramiteActual.estado}
              </EstadoBadge>

              <p className="socio-tramites-dato">Fecha de carga: {tramiteActual.fecha_carga?.slice(0, 10)}</p>
              {tramiteActual.fecha_vencimiento && (
                <p className="socio-tramites-dato">Fecha de vencimiento: {tramiteActual.fecha_vencimiento}</p>
              )}

              {renderArchivo()}

              {tramiteActual.observaciones && (
                <p className="socio-tramites-dato">Observaciones: {tramiteActual.observaciones}</p>
              )}
              {tramiteActual.revisado_en && (
                <p className="socio-tramites-dato">Revisado en: {tramiteActual.revisado_en.slice(0, 10)}</p>
              )}

              {tramiteActual.estado === 'en_revision' && (
                <button
                  type="button"
                  className="socio-modal-btn-ver"
                  onClick={() => setReviewOpen(true)}
                >
                  Revisar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {reviewOpen && tramiteActual && (
        <TramiteReviewModal
          tramite={tramiteActual}
          onSuccess={handleReviewed}
          onCancel={() => setReviewOpen(false)}
        />
      )}
    </SocioSubModal>
  );
}

SocioTramitesModal.propTypes = {
  idSocio: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { SocioTramitesModal };
