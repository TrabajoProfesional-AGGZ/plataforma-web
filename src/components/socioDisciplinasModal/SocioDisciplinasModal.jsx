import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getDisciplinasBySocio } from '../../services/disciplinasService';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import { useTheme } from '../../hooks/useTheme';
import './SocioDisciplinasModal.css';

function SocioDisciplinasModal({ idSocio, onClose }) {
  const { logoSocio: logo } = useTheme();
  const navigate = useNavigate();
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const handleClose = useCallback(onClose, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getDisciplinasBySocio(idSocio)
      .then(setDisciplinas)
      .catch(() => setDisciplinas([]))
      .finally(() => setLoading(false));
  }, [idSocio]);

  return (
    <SocioSubModal titulo="Disciplinas inscriptas" wrapperClass="socio-disciplinas-wrapper" onClose={handleClose}>
      {loading ? (
        <div className="socio-modal-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      ) : disciplinas.length === 0 ? (
        <p className="socio-modal-empty">El socio no está inscripto en ninguna disciplina.</p>
      ) : (
        <ul className="socio-modal-lista">
          {disciplinas.map((d) => (
            <li key={d.id} className="socio-modal-item">
              <div className="socio-modal-item-info">
                <span className="socio-modal-item-nombre">{d.nombre}</span>
                <span className={`socio-modal-badge ${d.estado?.nombre === 'Pausada' ? 'badge-pausada' : 'badge-activa'}`}>
                  {d.estado?.nombre ?? 'Activa'}
                </span>
              </div>
              <button
                type="button"
                className="socio-modal-btn-ver"
                onClick={() => { onClose(); navigate('/disciplinas', { state: { disciplinaId: d.id } }); }}
              >
                Ver disciplina
              </button>
            </li>
          ))}
        </ul>
      )}
    </SocioSubModal>
  );
}

SocioDisciplinasModal.propTypes = {
  idSocio: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { SocioDisciplinasModal };
