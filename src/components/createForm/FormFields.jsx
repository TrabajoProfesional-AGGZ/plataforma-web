import { Children, cloneElement, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, User, CreditCard, Phone, Mail } from 'lucide-react';
import PropTypes from 'prop-types';

export const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -52 : 52, opacity: 0 }),
};

/** Mensaje de error de un campo, con aparición/desaparición animada. */
export function FieldError({ message, id }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
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

FieldError.propTypes = {
  message: PropTypes.string,
  id: PropTypes.string,
};

/** Convierte un texto a un slug apto para usar como `id` de HTML. */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Envoltorio de campo de formulario: label con ícono + error animado.
 * Si recibe un único hijo, le clona `id`/`aria-invalid`/`aria-describedby`
 * automáticamente para asociarlo con el label y el mensaje de error.
 */
export function Field({ id, label, icon: Icon, error, children }) {
  const fieldId = id ?? `field-${slugify(label)}`;
  const errorId = `${fieldId}-error`;
  const singleChild = Children.count(children) === 1 ? Children.only(children) : null;
  const wiredChild = singleChild && isValidElement(singleChild)
    ? cloneElement(singleChild, {
      id: singleChild.props.id ?? fieldId,
      'aria-invalid': error ? 'true' : undefined,
      'aria-describedby': error ? errorId : undefined,
    })
    : children;

  return (
    <div className="csf-field">
      <label className="csf-label" htmlFor={fieldId}>
        <Icon size={13} strokeWidth={2} />
        {label}
      </label>
      {wiredChild}
      <FieldError message={error} id={errorId} />
    </div>
  );
}

Field.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

/** Input con el estilo estándar de los formularios, con estado de error opcional. */
export function StyledInput({ error, ...props }) {
  return (
    <input
      {...props}
      className={`csf-input${error ? ' csf-input--error' : ''}`}
    />
  );
}

StyledInput.propTypes = {
  error: PropTypes.bool,
};

/** Contenedor de un paso de un formulario multi-paso, con animación de deslizamiento según `direction`. */
export function FormStep({ direction, children }) {
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.26, ease: 'easeInOut' }}
      className="csf-fields"
    >
      {children}
    </motion.div>
  );
}

FormStep.propTypes = {
  direction: PropTypes.number,
  children: PropTypes.node.isRequired,
};

export const SOCIOS_STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Documento', icon: CreditCard },
  { id: 3, label: 'Contacto', icon: Phone },
];

/** Opciones de `<select>` para los tipos de documento soportados. */
export function DocTypeOptions() {
  return (
    <>
      <option value="">Seleccionar...</option>
      <option value="DNI">DNI — Documento Nacional de Identidad</option>
      <option value="LE">LE — Libreta de Enrolamiento</option>
      <option value="PAS">PAS — Pasaporte</option>
    </>
  );
}

/** Texto de ayuda para el campo de número de documento. */
export function DocHint() {
  return (
    <div className="csf-hint">
      Ingresá el número tal como aparece en el documento, sin puntos ni espacios.
    </div>
  );
}

const EMAIL_PATTERN = {
  value: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  message: 'Ingresá un correo válido'
};

/** Campo de número de documento: fuerza mayúsculas al tipear y muestra el `DocHint`. */
export function DocNumberField({ docNumberRegister, errors, fieldKey, label = 'Número de documento', placeholder = 'Ej. 12345678' }) {
  return (
    <>
      <Field label={label} icon={CreditCard} error={errors[fieldKey]?.message}>
        <StyledInput
          {...docNumberRegister}
          onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
          placeholder={placeholder}
          error={!!errors[fieldKey]}
          style={{ textTransform: 'uppercase' }}
        />
      </Field>
      <DocHint />
    </>
  );
}

DocNumberField.propTypes = {
  docNumberRegister: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  fieldKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
};

/** Campo de email con validación de formato, requerido opcionalmente. */
export function EmailField({ register, errors, required = false, placeholder = 'maria@ejemplo.com' }) {
  const rules = { pattern: EMAIL_PATTERN, ...(required && { required: 'El correo es requerido' }) };
  return (
    <Field label="Correo electrónico" icon={Mail} error={errors.email?.message}>
      <StyledInput
        {...register('email', rules)}
        type="email"
        placeholder={placeholder}
        error={!!errors.email}
      />
    </Field>
  );
}

EmailField.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
};

/** Select con el estilo estándar de los formularios, con estado de error opcional. */
export function StyledSelect({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`csf-select${error ? ' csf-select--error' : ''}`}
    >
      {children}
    </select>
  );
}

StyledSelect.propTypes = {
  error: PropTypes.bool,
  children: PropTypes.node.isRequired,
};
