import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, Mail, Shield,
  ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle,
  Calendar, Lock,
} from 'lucide-react';
import { crearUsuario } from '../../services/usuariosService';
import { fetchRoles } from '../../services/rolesService';
import logoVerde from '../../assets/logo-verde.png';
import '../createForm/CreateSocioForm.css';

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Documento', icon: CreditCard },
  { id: 3, label: 'Credenciales', icon: Mail },
  { id: 4, label: 'Rol', icon: Shield },
];

const stepFields = {
  1: ['nombre', 'apellido', 'fechaNacimiento'],
  2: ['tipoDoc', 'nroDocumento'],
  3: ['email', 'password'],
  4: ['rol'],
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

function StyledSelect({ error, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      className={`csf-select${error ? ' csf-select--error' : ''}`}
      style={{
        background: focused ? '#ffffff' : error ? '#ffffff' : '#f5f5f5',
        borderColor: error ? '#c0392b' : focused ? '#111111' : 'transparent',
      }}
    >
      {children}
    </select>
  );
}

export function CreateUserForm({ onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [navGuard, setNavGuard] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

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

  const onSubmit = async (data) => {
    setFormError('');
    const payload = {
      nombre: data.nombre,
      apellido: data.apellido,
      fecha_nacimiento: data.fechaNacimiento,
      tipo_doc: data.tipoDoc,
      nro_documento: data.nroDocumento,
      email: data.email,
      password: data.password,
      rol: data.rol,
    };
    try {
      await crearUsuario(payload);
      setSubmitted(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err) {
      if (err.message === 'usuario-duplicado') {
        setFormError('Ya existe un usuario con ese documento o email.');
      } else if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al crear el usuario. Verificá los datos e intentá de nuevo.');
      }
    }
  };

  const progress = (step / STEPS.length) * 100;

  const nroDocumentoRegister = register('nroDocumento', {
    required: 'El número es requerido',
    pattern: {
      value: /^[A-Z0-9]{5,20}$/,
      message: 'Solo letras mayúsculas y números (5–20 caracteres)',
    },
    setValueAs: (v) => v.toUpperCase(),
  });

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
                <h2>¡Usuario creado!</h2>
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
                <h1>Nuevo usuario</h1>
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
                        <div className="csf-grid-2">
                          <Field label="Nombre" icon={User} error={errors.nombre?.message}>
                            <StyledInput
                              {...register('nombre', { required: 'Requerido' })}
                              placeholder="María"
                              error={!!errors.nombre}
                            />
                          </Field>
                          <Field label="Apellido" icon={User} error={errors.apellido?.message}>
                            <StyledInput
                              {...register('apellido', { required: 'Requerido' })}
                              placeholder="González"
                              error={!!errors.apellido}
                            />
                          </Field>
                        </div>
                        <Field label="Fecha de nacimiento" icon={Calendar} error={errors.fechaNacimiento?.message}>
                          <StyledInput
                            {...register('fechaNacimiento', {
                              required: 'La fecha es requerida',
                              validate: (v) => {
                                const d = new Date(v);
                                const now = new Date();
                                if (isNaN(d.getTime())) return 'Fecha inválida';
                                if (d > now) return 'La fecha no puede ser futura';
                                if (now.getFullYear() - d.getFullYear() > 120) return 'Fecha inválida';
                                return true;
                              },
                            })}
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            error={!!errors.fechaNacimiento}
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
                        <Field label="Tipo de documento" icon={CreditCard} error={errors.tipoDoc?.message}>
                          <StyledSelect
                            {...register('tipoDoc', { required: 'Seleccioná un tipo' })}
                            error={!!errors.tipoDoc}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="DNI">DNI — Documento Nacional de Identidad</option>
                            <option value="LE">LE — Libreta de Enrolamiento</option>
                            <option value="PAS">PAS — Pasaporte</option>
                          </StyledSelect>
                        </Field>
                        <Field label="Número de documento" icon={CreditCard} error={errors.nroDocumento?.message}>
                          <StyledInput
                            {...nroDocumentoRegister}
                            onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                            placeholder="Ej. 12345678"
                            error={!!errors.nroDocumento}
                            style={{ textTransform: 'uppercase' }}
                          />
                        </Field>
                        <div className="csf-hint">
                          Ingresá el número tal como aparece en el documento, sin puntos ni espacios.
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.26, ease: 'easeInOut' }}
                        className="csf-fields"
                      >
                        <Field label="Correo electrónico" icon={Mail} error={errors.email?.message}>
                          <StyledInput
                            {...register('email', {
                              required: 'El correo es requerido',
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Ingresá un correo válido',
                              },
                            })}
                            type="email"
                            placeholder="maria@ejemplo.com"
                            error={!!errors.email}
                          />
                        </Field>
                        <Field label="Contraseña" icon={Lock} error={errors.password?.message}>
                          <StyledInput
                            {...register('password', {
                              required: 'La contraseña es requerida',
                              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                            })}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                            error={!!errors.password}
                          />
                        </Field>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div
                        key="step4"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.26, ease: 'easeInOut' }}
                        className="csf-fields"
                      >
                        <Field label="Rol" icon={Shield} error={errors.rol?.message}>
                          <StyledSelect
                            {...register('rol', { required: 'Seleccioná un rol' })}
                            error={!!errors.rol}
                          >
                            <option value="">Seleccionar...</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.nombre}>{r.nombre}</option>
                            ))}
                          </StyledSelect>
                        </Field>
                        {formError && <p className="csf-form-error">{formError}</p>}
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
                        disabled={isSubmitting || navGuard}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className="csf-btn-submit"
                      >
                        {isSubmitting ? (
                          <>
                            <motion.span
                              className="csf-spinner"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                            />
                            Creando...
                          </>
                        ) : (
                          <>
                            Crear usuario
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
      </div>
    </div>
  );
}
