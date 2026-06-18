import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';

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
    <button
      type="button"
      className="csf-overlay"
      aria-label="Cerrar"
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onCancel(); }}
    >
      <dialog open className="csf-wrapper" onClick={(e) => e.stopPropagation()}>
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
                backgroundColor: '#fdecea',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                <AlertTriangle size={20} color="#c0392b" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 14, color: '#7b1c1c', lineHeight: 1.5 }}>
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
      </dialog>
    </button>
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
