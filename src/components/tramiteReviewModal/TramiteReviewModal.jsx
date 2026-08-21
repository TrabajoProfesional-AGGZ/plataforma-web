import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck } from 'lucide-react';
import PropTypes from 'prop-types';
import { revisarTramite } from '../../services/tramitesService';
import { MAX_LEN } from '../../utils/formValidators';
import '../createForm/CreateSocioForm.css';
import { StyledSelect } from '../createForm/FormFields';
import { ModalOverlay } from '../createForm/ModalOverlay';

function mensajeError(err) {
  return err?.message === 'servicio-no-disponible'
    ? 'El servicio no está disponible. Intentá de nuevo más tarde.'
    : 'Error al revisar el trámite. Intentá de nuevo.';
}

/**
 * Modal para aprobar o rechazar un trámite en revisión, con observaciones
 * opcionales. El dropdown solo ofrece "aprobado"/"rechazado" — un trámite ya
 * revisado no puede volver a "en_revision".
 */
export function TramiteReviewModal({ tramite, onSuccess, onCancel }) {
  const [estado, setEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmar() {
    setGuardando(true);
    setError('');
    try {
      const actualizado = await revisarTramite(tramite.id, {
        estado,
        observaciones: observaciones.trim() || null,
      });
      onSuccess(actualizado);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onCancel} ariaLabel={`Revisar trámite: ${tramite.tipo_tramite.nombre}`}>
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="csf-outer-card"
      >
        <div className="csf-header">
          <h1>Revisar trámite</h1>
          <p>{tramite.tipo_tramite.nombre}</p>
        </div>

        <div className="csf-card">
          <div className="csf-fields">
            <div className="csf-field">
              <label className="csf-label">
                <ClipboardCheck size={13} strokeWidth={2} />
                Estado
              </label>
              <StyledSelect
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </StyledSelect>
            </div>

            <div className="csf-field">
              <label className="csf-label" htmlFor="tramite-observaciones">
                Observaciones
              </label>
              <textarea
                id="tramite-observaciones"
                className="csf-input"
                rows={4}
                maxLength={MAX_LEN.OBSERVACIONES_TRAMITE}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional"
              />
              <span className="csf-hint">
                {observaciones.length}/{MAX_LEN.OBSERVACIONES_TRAMITE}
              </span>
            </div>

            {error && <p className="csf-form-error">{error}</p>}

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
                disabled={!estado || guardando}
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
                ) : 'Confirmar'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

TramiteReviewModal.propTypes = {
  tramite: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo_tramite: PropTypes.shape({ nombre: PropTypes.string.isRequired }).isRequired,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
