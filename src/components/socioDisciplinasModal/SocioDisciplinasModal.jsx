import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getDisciplinasBySocio } from '../../services/disciplinasService';
import { ResolverListaEsperaModal } from '../resolverListaEsperaModal/ResolverListaEsperaModal';
import { SocioSubModal } from '../socioAccionesExtra/SocioSubModal';
import { useTheme } from '../../hooks/useTheme';
import './SocioDisciplinasModal.css';

/**
 * Modal con las disciplinas en las que está inscripto un socio. Una disciplina
 * `en_espera` muestra un botón "Revisar" que abre `ResolverListaEsperaModal`
 * en vez de "Ver disciplina" — mientras ese sub-modal está abierto, el `onClose`
 * de este modal se anula (no-op) para que un Escape ahí no cierre también este.
 */
function SocioDisciplinasModal({ idSocio, nombreSocio, onClose }) {
  const { logoSocio: logo } = useTheme();
  const navigate = useNavigate();
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolverDisciplina, setResolverDisciplina] = useState(null);
  const handleClose = useCallback(onClose, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  function cargarDisciplinas() {
    return getDisciplinasBySocio(idSocio)
      .then(setDisciplinas)
      .catch(() => setDisciplinas([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    cargarDisciplinas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSocio]);

  function handleListaEsperaSuccess() {
    setResolverDisciplina(null);
    setLoading(true);
    cargarDisciplinas();
  }

  return (
    <SocioSubModal
      titulo="Disciplinas inscriptas"
      wrapperClass="socio-disciplinas-wrapper"
      onClose={resolverDisciplina ? () => {} : handleClose}
    >
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
              {d.estado_suscripcion === 'en_espera' ? (
                <button
                  type="button"
                  className="socio-modal-btn-ver"
                  onClick={() => setResolverDisciplina(d)}
                >
                  Revisar
                </button>
              ) : (
                <button
                  type="button"
                  className="socio-modal-btn-ver"
                  onClick={() => { onClose(); navigate('/disciplinas', { state: { disciplinaId: d.id } }); }}
                >
                  Ver disciplina
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {resolverDisciplina && (
        <ResolverListaEsperaModal
          idDisciplina={resolverDisciplina.id}
          idSocio={idSocio}
          nombreSocio={nombreSocio}
          onSuccess={handleListaEsperaSuccess}
          onCancel={() => setResolverDisciplina(null)}
        />
      )}
    </SocioSubModal>
  );
}

SocioDisciplinasModal.propTypes = {
  idSocio: PropTypes.string.isRequired,
  nombreSocio: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { SocioDisciplinasModal };
