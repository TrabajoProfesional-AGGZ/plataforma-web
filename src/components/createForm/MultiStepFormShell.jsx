import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import logoVerde from '../../assets/logo-verde.png';
import { ModalOverlay } from './ModalOverlay';
import { useTheme } from '../../hooks/useTheme';
import './CreateSocioForm.css';

// framer-motion interpola colores en JS (para animar background/rotate/etc.),
// no puede resolver var(--token) en tiempo de animación — por eso estos
// valores están duplicados acá en vez de leerse de tokens.css. Deben
// mantenerse en sync con --color-text-primary/--color-border-medium/
// --color-surface/--color-text-secondary/--status-success-border.
const STEP_COLORS = {
  light: { bubbleActive: '#111111', bubbleIdle: '#e0e0e0', onBubble: '#ffffff', idleIcon: '#4a4a4a', success: '#0D6E0D' },
  dark: { bubbleActive: '#f5f5f5', bubbleIdle: '#3a3a3a', onBubble: '#1e1e1e', idleIcon: '#b0b0b0', success: '#4ade80' },
};

export function MultiStepFormShell({
  steps,
  step,
  submitted,
  navGuard,
  isSubmitting = false,
  title,
  successTitle,
  successMessage,
  submitLabel,
  submitLoadingLabel,
  onCancel,
  goBack,
  goNext,
  nextDisabled = false,
  onFormSubmit,
  direction,
  children,
}) {
  const { theme } = useTheme();
  const colors = STEP_COLORS[theme];
  const progress = (step / steps.length) * 100;
  const isSingleStep = steps.length === 1;

  return (
    <ModalOverlay onClose={onCancel}>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180 }}
              className="csf-outer-card csf-success"
            >
              <motion.div
                className="csf-success-logo-circle"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
              >
                <img src={logoVerde} alt="SocioUnido" className="csf-success-logo" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, delay: 0.4 }}
              >
                <CheckCircle2 size={48} color={colors.success} strokeWidth={1.5} />
              </motion.div>
              <div>
                <h2>{successTitle}</h2>
                <p>{successMessage}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="csf-outer-card"
            >
              <div className="csf-header">
                <h1>{title}</h1>
                {!isSingleStep && (
                  <p>Paso {step} de {steps.length} — {steps[step - 1].label}</p>
                )}
              </div>

              {!isSingleStep && (
                <>
                  <div className="csf-steps">
                    {steps.map((s, i) => {
                      const done = step > s.id;
                      const active = step === s.id;
                      const Icon = s.icon;
                      return (
                        <div key={s.id} className="csf-step-item">
                          <div className="csf-step-meta">
                            <motion.div
                              className="csf-step-bubble"
                              animate={{ background: done || active ? colors.bubbleActive : colors.bubbleIdle }}
                              transition={{ duration: 0.3 }}
                            >
                              <AnimatePresence mode="wait">
                                {done ? (
                                  <motion.span
                                    key="check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                  >
                                    <CheckCircle2 size={16} color={colors.onBubble} strokeWidth={2.5} />
                                  </motion.span>
                                ) : (
                                  <motion.span key="icon" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                                    <Icon size={16} color={active ? colors.onBubble : colors.idleIcon} strokeWidth={2} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            <span className={`csf-step-label${active ? ' csf-step-label--active' : ''}`}>
                              {s.label}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className="csf-connector">
                              <motion.div
                                className="csf-connector-fill"
                                animate={{ width: step > s.id ? '100%' : '0%' }}
                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="csf-progress">
                    <motion.div
                      className="csf-progress-fill"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                </>
              )}

              <div className="csf-card">
                <form
                  onSubmit={onFormSubmit}
                  onKeyDown={(e) => { if (e.key === 'Enter' && step < steps.length) e.preventDefault(); }}
                >
                  {direction !== undefined ? (
                    <AnimatePresence mode="wait" custom={direction}>
                      {children}
                    </AnimatePresence>
                  ) : children}

                  <div className={`csf-nav ${step > 1 ? 'csf-nav--between' : 'csf-nav--end'}`}>
                    {step > 1 && (
                      <motion.button
                        type="button"
                        onClick={goBack}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className="csf-btn-back"
                      >
                        <ChevronLeft size={17} />
                        Atrás
                      </motion.button>
                    )}
                    {step === 1 && (
                      <motion.button
                        type="button"
                        onClick={onCancel}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className="csf-btn-back"
                      >
                        Cancelar
                      </motion.button>
                    )}
                    {step < steps.length ? (
                      <motion.button
                        type="button"
                        onClick={goNext}
                        disabled={nextDisabled}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className="csf-btn-next"
                      >
                        Siguiente
                        <ChevronRight size={17} />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="submit"
                        disabled={isSubmitting || navGuard}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className="csf-btn-submit"
                      >
                        {isSubmitting && submitLoadingLabel ? (
                          <>
                            <motion.span
                              className="csf-spinner"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                            />
                            {submitLoadingLabel}
                          </>
                        ) : (
                          <>
                            {submitLabel}
                            <CheckCircle2 size={17} />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </ModalOverlay>
  );
}

MultiStepFormShell.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, label: PropTypes.string, icon: PropTypes.elementType })).isRequired,
  step: PropTypes.number.isRequired,
  submitted: PropTypes.bool.isRequired,
  navGuard: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  title: PropTypes.string,
  successTitle: PropTypes.string,
  successMessage: PropTypes.string,
  submitLabel: PropTypes.string,
  submitLoadingLabel: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  goBack: PropTypes.func,
  goNext: PropTypes.func,
  nextDisabled: PropTypes.bool,
  onFormSubmit: PropTypes.func.isRequired,
  direction: PropTypes.number,
  children: PropTypes.node.isRequired,
};