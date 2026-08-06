import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Hash } from 'lucide-react';
import PropTypes from 'prop-types';
import { getSocioByNroSocio } from '../../services/sociosService';
import { createEntrada } from '../../services/entradasService';
import { marcarPagadaCaja } from '../../services/finanzasService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput } from '../createForm/FormFields';
import { ModalOverlay } from '../createForm/ModalOverlay';

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
  const [nroSocioInput, setNroSocioInput] = useState('');
  const [busquedaSocio, setBusquedaSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState('');
  const [socioPreview, setSocioPreview] = useState(null);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const previewSocio = async (value) => {
    if (!value?.trim()) return;
    try {
      const socio = await getSocioByNroSocio(value.trim());
      setSocioPreview(socio);
    } catch {
      // preview silently fails
    }
  };

  const buscarSocio = async () => {
    const nro = nroSocioInput.trim();
    if (!nro) return;

    const socioYaResuelto = socioPreview?.nro_socio === nro ? socioPreview : null;
    if (socioYaResuelto) {
      setSocioSeleccionado(socioYaResuelto);
      setErrorSocio('');
      return;
    }

    setBusquedaSocio(true);
    setErrorSocio('');
    try {
      const socio = await getSocioByNroSocio(nro);
      setSocioSeleccionado(socio);
    } catch {
      setErrorSocio('No se encontró ningún socio con ese número.');
    } finally {
      setBusquedaSocio(false);
    }
  };

  async function handleConfirmar() {
    if (!socioSeleccionado) return;
    setGuardando(true);
    setSubmitError('');
    try {
      const entrada = await createEntrada({ id_evento: evento.id, id_socio: socioSeleccionado.id });
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
            <Field label="N° de socio" icon={Hash} error={errorSocio}>
              <div className="csf-socio-input-row">
                <StyledInput
                  type="text"
                  placeholder="Ej. 1234"
                  value={nroSocioInput}
                  onChange={(e) => {
                    setNroSocioInput(e.target.value);
                    setSocioPreview(null);
                    setSocioSeleccionado(null);
                    setErrorSocio('');
                  }}
                  onBlur={(e) => previewSocio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); buscarSocio(); }
                  }}
                />
                <button
                  type="button"
                  className="csf-btn-agregar-socio"
                  onClick={buscarSocio}
                  disabled={busquedaSocio || !nroSocioInput.trim()}
                >
                  Buscar
                </button>
              </div>
              {socioSeleccionado && (
                <span className="csf-socio-nombre-inline">
                  <CheckCircle2 size={13} color="var(--status-success-border)" />
                  {socioSeleccionado.apellido} {socioSeleccionado.nombre}
                </span>
              )}
            </Field>

            {submitError && <p className="csf-form-error">{submitError}</p>}

            <div className="csf-nav csf-nav--between">
              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="csf-btn-back"
              >
                Cancelar
              </motion.button>
              <motion.button
                type="button"
                onClick={handleConfirmar}
                disabled={!socioSeleccionado || guardando}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="csf-btn-submit"
              >
                {guardando ? (
                  <>
                    <motion.span
                      className="csf-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    />
                    Guardando...
                  </>
                ) : 'Reservar entrada'}
              </motion.button>
            </div>
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
