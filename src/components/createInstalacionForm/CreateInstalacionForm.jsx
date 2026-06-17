import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Settings,
  ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle,
  Users, DollarSign, Tag,
} from 'lucide-react';
import logoVerde from '../../assets/logo-verde.png';
import '../createForm/CreateSocioForm.css';

const STEPS = [
  { id: 1, label: 'Datos', icon: Building2 },
  { id: 2, label: 'Configuración', icon: Settings },
];

const stepFields = {
  1: ['nombre', 'tipo'],
  2: ['capacidad_maxima', 'valor_hora'],
};

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -52 : 52, opacity: 0 }),
};

function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="csf-error"
        >
          <AlertCircle size={12} />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="csf-field">
      <label className="csf-label">
        <Icon size={13} strokeWidth={2} />
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function StyledInput({ error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      className={`csf-input${error ? ' csf-input--error' : ''}`}
      style={{
        background: focused ? '#ffffff' : error ? '#ffffff' : '#f5f5f5',
        borderColor: error ? '#c0392b' : focused ? '#111111' : 'transparent',
      }}
    />
  );
}

export function CreateInstalacionForm({ onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [navGuard, setNavGuard] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    setNavGuard(true);
    setDirection(1);
    setStep((s) => s + 1);
    setTimeout(() => setNavGuard(false), 300);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const onSubmit = (data) => {
    setSubmitted(true);
    setTimeout(() => onSuccess({
      nombre: data.nombre.trim(),
      tipo: data.tipo.trim(),
      capacidad_maxima: Number(data.capacidad_maxima),
      valor_hora: Number(data.valor_hora),
      activa: Boolean(data.activa),
    }), 1800);
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="csf-overlay" onClick={onCancel}>
      <div className="csf-wrapper" onClick={(e) => e.stopPropagation()}>
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
                <CheckCircle2 size={48} color="#0D6E0D" strokeWidth={1.5} />
              </motion.div>
              <div>
                <h2>¡Instalación creada!</h2>
                <p>Los datos fueron guardados correctamente.</p>
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
                <h1>Nueva instalación</h1>
                <p>Paso {step} de {STEPS.length} — {STEPS[step - 1].label}</p>
              </div>

              <div className="csf-steps">
                {STEPS.map((s, i) => {
                  const done = step > s.id;
                  const active = step === s.id;
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="csf-step-item">
                      <div className="csf-step-meta">
                        <motion.div
                          className="csf-step-bubble"
                          animate={{ background: done || active ? '#111111' : '#e0e0e0' }}
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
                                <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.5} />
                              </motion.span>
                            ) : (
                              <motion.span key="icon" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                                <Icon size={16} color={active ? '#ffffff' : '#4a4a4a'} strokeWidth={2} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <span className={`csf-step-label${active ? ' csf-step-label--active' : ''}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
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

              <div className="csf-card">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && step < STEPS.length) e.preventDefault(); }}
                >
                  <AnimatePresence mode="wait" custom={direction}>
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.26, ease: 'easeInOut' }}
                        className="csf-fields"
                      >
                        <Field label="Nombre de la instalación" icon={Building2} error={errors.nombre?.message}>
                          <StyledInput
                            {...register('nombre', { required: 'El nombre es requerido' })}
                            placeholder="Ej. Cancha de fútbol"
                            error={!!errors.nombre}
                          />
                        </Field>
                        <Field label="Tipo de instalación" icon={Tag} error={errors.tipo?.message}>
                          <StyledInput
                            {...register('tipo', { required: 'El tipo es requerido' })}
                            placeholder="Ej. Deportiva, Social, Recreativa"
                            error={!!errors.tipo}
                          />
                        </Field>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.26, ease: 'easeInOut' }}
                        className="csf-fields"
                      >
                        <Field label="Capacidad máxima (personas)" icon={Users} error={errors.capacidad_maxima?.message}>
                          <StyledInput
                            {...register('capacidad_maxima', {
                              required: 'La capacidad es requerida',
                              min: { value: 1, message: 'Debe ser mayor a 0' },
                              validate: (v) => Number(v) > 0 || 'Debe ser mayor a 0',
                            })}
                            type="number"
                            min="1"
                            placeholder="Ej. 50"
                            error={!!errors.capacidad_maxima}
                          />
                        </Field>
                        <Field label="Valor por hora ($)" icon={DollarSign} error={errors.valor_hora?.message}>
                          <StyledInput
                            {...register('valor_hora', {
                              required: 'El valor por hora es requerido',
                              min: { value: 0, message: 'No puede ser negativo' },
                              validate: (v) => Number(v) >= 0 || 'No puede ser negativo',
                            })}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ej. 1500"
                            error={!!errors.valor_hora}
                          />
                        </Field>
                        <div className="csf-field">
                          <span className="csf-label">
                            <CheckCircle2 size={13} strokeWidth={2} />
                            Estado
                          </span>
                          <label className="csf-checkbox-label">
                            <input
                              type="checkbox"
                              className="csf-checkbox-input"
                              defaultChecked
                              {...register('activa')}
                            />
                            La instalación está activa y disponible para reservas
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                    {step < STEPS.length ? (
                      <motion.button
                        type="button"
                        onClick={goNext}
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
                        disabled={navGuard}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className="csf-btn-submit"
                      >
                        Crear instalación
                        <CheckCircle2 size={17} />
                      </motion.button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
