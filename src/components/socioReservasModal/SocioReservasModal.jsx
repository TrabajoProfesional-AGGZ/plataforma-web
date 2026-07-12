import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getReservasPorSocio } from '../../services/reservasService';
import { getInstalaciones } from '../../services/instalacionesService';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import { useTheme } from '../../hooks/useTheme';
import './SocioReservasModal.css';

function SocioReservasModal({ nroSocio, onClose }) {
  const { logoSocio: logo } = useTheme();
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [instalacionMap, setInstalacionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const handleClose = useCallback(onClose, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([getReservasPorSocio(nroSocio), getInstalaciones()])
      .then(([reservasData, instalaciones]) => {
        setInstalacionMap(Object.fromEntries(instalaciones.map((i) => [i.id, i.nombre])));
        setReservas(reservasData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nroSocio]);

  return (
    <SocioSubModal titulo="Reservas activas" wrapperClass="socio-reservas-wrapper" onClose={handleClose}>
      {loading ? (
        <div className="socio-modal-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      ) : reservas.length === 0 ? (
        <p className="socio-modal-empty">El socio no tiene reservas activas.</p>
      ) : (
        <ul className="socio-modal-lista">
          {reservas.map((r) => (
            <li key={r.id} className="socio-modal-item socio-reservas-item">
              <div className="socio-modal-item-info socio-reservas-info">
                <span className="socio-modal-item-nombre">
                  {instalacionMap[r.id_instalacion] ?? r.id_instalacion}
                </span>
                <span className="socio-reservas-detalle">
                  {r.fecha_reserva} · {r.hora_inicio?.slice(0, 5)}–{r.hora_fin?.slice(0, 5)}
                </span>
                <span className="socio-reservas-estado">{r.estado}</span>
              </div>
              <button
                type="button"
                className="socio-modal-btn-ver"
                onClick={() => { onClose(); navigate('/instalaciones', { state: { instalacionId: r.id_instalacion } }); }}
              >
                Ver instalación
              </button>
            </li>
          ))}
        </ul>
      )}
    </SocioSubModal>
  );
}

SocioReservasModal.propTypes = {
  nroSocio: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { SocioReservasModal };
