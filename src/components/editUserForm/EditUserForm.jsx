import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle2, AlertCircle } from 'lucide-react';
import { editarUsuario } from '../../services/usuariosService';
import logoVerde from '../../assets/logo-verde.png';
import '../createForm/CreateSocioForm.css';

function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
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

function Field({ id, label, icon: Icon, error, children }) {
  return (
    <div className="csf-field">
      <label className="csf-label" htmlFor={id}>
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

export function EditUserForm({ usuario, onSuccess, onCancel }) {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
    },
  });

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const onSubmit = async (data) => {
    setFormError('');
    try {
      const actualizado = await editarUsuario(usuario.id, {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
      });
      setSubmitted(true);
      setTimeout(() => onSuccess(actualizado), 1800);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al guardar los cambios. Intentá de nuevo.');
      }
    }
  };

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
                <h2>¡Datos actualizados!</h2>
                <p>Los cambios fueron guardados correctamente.</p>
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
                <h1>Editar usuario</h1>
              </div>
              <div className="csf-card">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="csf-fields">
                    <Field id="edit-nombre" label="Nombre" icon={User} error={errors.nombre?.message}>
                      <StyledInput
                        id="edit-nombre"
                        {...register('nombre', { required: 'El nombre es obligatorio' })}
                        placeholder="ej: Juan"
                        error={!!errors.nombre}
                      />
                    </Field>
                    <Field id="edit-apellido" label="Apellido" icon={User} error={errors.apellido?.message}>
                      <StyledInput
                        id="edit-apellido"
                        {...register('apellido', { required: 'El apellido es obligatorio' })}
                        placeholder="ej: Pérez"
                        error={!!errors.apellido}
                      />
                    </Field>
                    {formError && (
                      <p className="csf-form-error" role="alert">{formError}</p>
                    )}
                  </div>
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
                      type="submit"
                      disabled={isSubmitting}
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
                          Guardando...
                        </>
                      ) : (
                        <>
                          Guardar cambios
                          <CheckCircle2 size={17} />
                        </>
                      )}
                    </motion.button>
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
