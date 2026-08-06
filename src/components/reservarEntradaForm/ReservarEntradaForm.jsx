import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { createEntrada } from '../../services/entradasService';
import { marcarPagadaCaja } from '../../services/finanzasService';
import { useBuscadorSocio } from '../../hooks/useBuscadorSocio';
import '../createForm/CreateSocioForm.css';
import { FormFooterActions } from '../createForm/FormFooterActions';
import { ModalOverlay } from '../createForm/ModalOverlay';
import { SocioBuscadorField } from '../createForm/SocioBuscadorField';

const AVISOS_ESTADO_SOCIO = {
  Moroso: 'No se puede reservar una entrada para este socio hasta que no regularice su situación financiera con el club.',
  Suspendido: 'No se puede reservar una entrada para este socio hasta que no termine su suspensión.',
};

const MENSAJES_ERROR_SUBMIT = {
  'socio-moroso': AVISOS_ESTADO_SOCIO.Moroso,
  'socio-suspendido': AVISOS_ESTADO_SOCIO.Suspendido,
  fuera_de_plazo: 'Ya no se pueden reservar entradas para este evento (falta menos de una hora para que empiece).',
  ya_tiene_entrada: 'Este socio ya tiene una entrada para este evento.',
  sin_cupo: 'No quedan entradas disponibles para este evento.',
};

export function ReservarEntradaForm({ evento, onSuccess, onCancel }) {
  const buscador = useBuscadorSocio();
  const [guardando, setGuardando] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleConfirmar() {
    if (!buscador.socioSeleccionado) return;
    setGuardando(true);
    setSubmitError('');
    try {
      const entrada = await createEntrada({ id_evento: evento.id, id_socio: buscador.socioSeleccionado.id });
      await marcarPagadaCaja('entrada', entrada.id);
      onSuccess();
    } catch (e) {
      setSubmitError(MENSAJES_ERROR_SUBMIT[e.message] || 'No se pudo reservar la entrada. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onCancel} ariaLabel={`Reservar entrada: ${evento.nombre}`}>
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="csf-outer-card"
      >
        <div className="csf-header">
          <h1>Reservar entrada</h1>
          <p>{evento.nombre}</p>
        </div>

        <div className="csf-card">
          <div className="csf-fields">
            <SocioBuscadorField
              nroSocioInput={buscador.nroSocioInput}
              busquedaSocio={buscador.busquedaSocio}
              errorSocio={buscador.errorSocio}
              socioSeleccionado={buscador.socioSeleccionado}
              onChange={buscador.handleNroSocioChange}
              onBlurPreview={buscador.previewSocio}
              onBuscar={buscador.buscarSocio}
            />

            {submitError && <p className="csf-form-error">{submitError}</p>}

            <FormFooterActions
              onCancel={onCancel}
              onSubmit={handleConfirmar}
              disabled={!buscador.socioSeleccionado || guardando}
              loading={guardando}
              submitLabel="Reservar entrada"
            />
          </div>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

ReservarEntradaForm.propTypes = {
  evento: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
