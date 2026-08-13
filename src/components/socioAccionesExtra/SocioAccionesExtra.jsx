import { useState } from 'react';
import PropTypes from 'prop-types';
import { usePermiso } from '../../hooks/usePermiso';
import { SocioDisciplinasModal } from '../socioDisciplinasModal/SocioDisciplinasModal';
import { SocioReservasModal } from '../socioReservasModal/SocioReservasModal';
import { SocioTramitesModal } from '../socioTramitesModal/SocioTramitesModal';
import { SocioPagosPendientesModal } from '../socioPagosPendientesModal/SocioPagosPendientesModal';
import './SocioAccionesExtra.css';

function SocioAccionesExtra({ idSocio, nroSocio, nombreSocio }) {
  const puedeVerDisciplinas = usePermiso('ver_disciplinas');
  const puedeVerReservas = usePermiso('ver_reservas');
  const puedeVerTramites = usePermiso('ver_tramites');
  const puedeVerPagosPendientes = usePermiso('ver_pagos_pendientes');
  const [disciplinasOpen, setDisciplinasOpen] = useState(false);
  const [reservasOpen, setReservasOpen] = useState(false);
  const [tramitesOpen, setTramitesOpen] = useState(false);
  const [pagosPendientesOpen, setPagosPendientesOpen] = useState(false);

  if (!puedeVerDisciplinas && !puedeVerReservas && !puedeVerTramites && !puedeVerPagosPendientes) return null;

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
        {puedeVerPagosPendientes && (
          <button
            type="button"
            className="socio-acciones-btn"
            onClick={() => setPagosPendientesOpen(true)}
          >
            Pagos pendientes
          </button>
        )}
      </div>

      {disciplinasOpen && (
        <SocioDisciplinasModal
          idSocio={idSocio}
          nombreSocio={nombreSocio}
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

      {pagosPendientesOpen && (
        <SocioPagosPendientesModal
          idSocio={idSocio}
          onClose={() => setPagosPendientesOpen(false)}
        />
      )}
    </>
  );
}

SocioAccionesExtra.propTypes = {
  idSocio: PropTypes.string.isRequired,
  nroSocio: PropTypes.string.isRequired,
  nombreSocio: PropTypes.string.isRequired,
};

export { SocioAccionesExtra };
