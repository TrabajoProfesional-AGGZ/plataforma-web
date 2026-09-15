import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * @param {'danger'|'primary'} [props.variant] - `'danger'` (default) para acciones irreversibles;
 *   `'primary'` para confirmaciones no destructivas (aviso amarillo, botón no rojo).
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
  variant = 'danger',
}) {
  const modificadorAviso = variant === 'danger' ? 'danger' : 'warning';
  const colorAviso = variant === 'danger' ? 'var(--color-danger)' : 'var(--status-warning-border)';

  return (
    <AnimatePresence>
      {open && (
        <ModalOverlay onClose={onCancel}>
          <div className="csf-outer-card">
            <div className="csf-header">
              <h1>{titulo}</h1>
              {subtitulo && <p>{subtitulo}</p>}
            </div>

            <div className="csf-card">
              <div className="csf-fields">
                <div className={`confirm-aviso confirm-aviso--${modificadorAviso}`}>
                  <AlertTriangle size={20} color={colorAviso} strokeWidth={2} className="confirm-aviso-icono" />
                  <p className="confirm-aviso-texto">
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
                    className={variant === 'danger' ? 'csf-btn-danger' : 'csf-btn-submit'}
                  >
                    {guardando ? labelGuardando : labelConfirmar}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </AnimatePresence>
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
  variant: PropTypes.oneOf(['danger', 'primary']),
};

export default ConfirmDeleteModal;