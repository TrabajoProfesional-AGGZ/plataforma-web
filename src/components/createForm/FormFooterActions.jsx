import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function FormFooterActions({
  onCancel,
  onSubmit,
  disabled = false,
  loading = false,
  submitLabel,
  loadingLabel = 'Guardando...',
}) {
  return (
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
        onClick={onSubmit}
        disabled={disabled}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="csf-btn-submit"
      >
        {loading ? (
          <>
            <motion.span
              className="csf-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
            {loadingLabel}
          </>
        ) : submitLabel}
      </motion.button>
    </div>
  );
}

FormFooterActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  submitLabel: PropTypes.node.isRequired,
  loadingLabel: PropTypes.string,
};
