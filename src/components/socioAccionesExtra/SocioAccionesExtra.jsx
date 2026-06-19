import { useState } from 'react';
import PropTypes from 'prop-types';
import { usePermiso } from '../../hooks/usePermiso';
import { SocioDisciplinasModal } from '../socioDisciplinasModal/SocioDisciplinasModal';
import { SocioReservasModal } from '../socioReservasModal/SocioReservasModal';
import './SocioAccionesExtra.css';

function SocioAccionesExtra({ idSocio, nroSocio }) {
  const puedeVerDisciplinas = usePermiso('ver_disciplinas');
  const puedeVerReservas = usePermiso('ver_reservas');
  const [disciplinasOpen, setDisciplinasOpen] = useState(false);
  const [reservasOpen, setReservasOpen] = useState(false);

  if (!puedeVerDisciplinas && !puedeVerReservas) return null;

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
    </>
  );
}

SocioAccionesExtra.propTypes = {
  idSocio: PropTypes.string.isRequired,
  nroSocio: PropTypes.string.isRequired,
};

export { SocioAccionesExtra };
