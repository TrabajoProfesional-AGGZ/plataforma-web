import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import { ModalOverlay } from '../createForm/ModalOverlay';

/**
 * Modal de confirmación con paso intermedio antes de ejecutar una acción
 * irreversible. Pese al nombre, es genérico: se usa también para confirmar
 * acciones que no son borrados (ej. marcar un pago como realizado en caja),
 * ajustando `labelConfirmar`/`labelGuardando`/`mensaje` según el caso.
 * @param {object} props
 * @param {boolean} props.open - Si es `false`, el modal no renderiza nada.
 * @param {string} props.titulo
 * @param {string} [props.subtitulo]
 * @param {string} props.mensaje - Texto de advertencia sobre la acción a confirmar.
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {boolean} [props.guardando] - Deshabilita el botón de confirmar y cambia su label.
 * @param {string} [props.errorModal] - Mensaje de error a mostrar si la acción falló.
 * @param {string} [props.labelConfirmar]
 * @param {string} [props.labelGuardando]
 */
function ConfirmDeleteModal({
  open,
  titulo,
  subtitulo,
  mensaje,
  onConfirm,
  onCancel,
  guardando = false,
  errorModal = null,
  labelConfirmar = 'Eliminar',
  labelGuardando = 'Eliminando...',
}) {
  if (!open) return null;

  return (
    <ModalOverlay onClose={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="csf-outer-card"
      >
        <div className="csf-header">
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>

        <div className="csf-card">
          <div className="csf-fields">
            <div style={{
              backgroundColor: 'var(--status-error-surface-bg)',
              border: '1px solid var(--status-error-surface-border)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}>
              <AlertTriangle size={20} color="var(--color-danger)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-danger)', lineHeight: 1.5 }}>
                {mensaje}
              </p>
            </div>

            {errorModal && (
              <p className="csf-form-error" role="alert">{errorModal}</p>
            )}

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
                onClick={onConfirm}
                disabled={guardando}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="csf-btn-danger"
              >
                {guardando ? labelGuardando : labelConfirmar}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

ConfirmDeleteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  titulo: PropTypes.string.isRequired,
  subtitulo: PropTypes.string,
  mensaje: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  guardando: PropTypes.bool,
  errorModal: PropTypes.string,
  labelConfirmar: PropTypes.string,
  labelGuardando: PropTypes.string,
};

export default ConfirmDeleteModal;