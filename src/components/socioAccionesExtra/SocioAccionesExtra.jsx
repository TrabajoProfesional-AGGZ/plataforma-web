import { useState } from 'react';
import PropTypes from 'prop-types';
import { usePermiso } from '../../hooks/usePermiso';
import { SocioDisciplinasModal } from '../socioDisciplinasModal/SocioDisciplinasModal';
import { SocioReservasModal } from '../socioReservasModal/SocioReservasModal';
import { SocioTramitesModal } from '../socioTramitesModal/SocioTramitesModal';
import './SocioAccionesExtra.css';

function SocioAccionesExtra({ idSocio, nroSocio }) {
  const puedeVerDisciplinas = usePermiso('ver_disciplinas');
  const puedeVerReservas = usePermiso('ver_reservas');
  const puedeVerTramites = usePermiso('ver_tramites');
  const [disciplinasOpen, setDisciplinasOpen] = useState(false);
  const [reservasOpen, setReservasOpen] = useState(false);
  const [tramitesOpen, setTramitesOpen] = useState(false);

  if (!puedeVerDisciplinas && !puedeVerReservas && !puedeVerTramites) return null;

  return (
    <>
      <div className="socio-acciones-extra">
        {puedeVerDisciplinas && (
          <button
            type="button"
            className="socio-acciones-btn"
            onClick={() => setDisciplinasOpen(true)}
          >
            Ver disciplinas inscriptas
          </button>
        )}
        {puedeVerReservas && (
          <button
            type="button"
            className="socio-acciones-btn"
            onClick={() => setReservasOpen(true)}
          >
            Ver reservas activas
          </button>
        )}
        {puedeVerTramites && (
          <button
            type="button"
            className="socio-acciones-btn"
            onClick={() => setTramitesOpen(true)}
          >
            Ver trámites
          </button>
        )}
      </div>

      {disciplinasOpen && (
        <SocioDisciplinasModal
          idSocio={idSocio}
          onClose={() => setDisciplinasOpen(false)}
        />
      )}

      {reservasOpen && (
        <SocioReservasModal
          nroSocio={nroSocio}
          onClose={() => setReservasOpen(false)}
        />
      )}

      {tramitesOpen && (
        <SocioTramitesModal
          idSocio={idSocio}
          onClose={() => setTramitesOpen(false)}
        />
      )}
    </>
  );
}

SocioAccionesExtra.propTypes = {
  idSocio: PropTypes.string.isRequired,
  nroSocio: PropTypes.string.isRequired,
};

export { SocioAccionesExtra };
