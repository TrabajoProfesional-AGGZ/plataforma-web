import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, User, CreditCard, Phone, Mail, ChevronDown, Check } from 'lucide-react';
import PropTypes from 'prop-types';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { setNativeValue, mergeRefs } from './nativeInputUtils';
import { usePickerPopover } from './usePickerPopover';
import './Pickers.css';

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

/**
 * Input con el estilo estándar de los formularios, con estado de error opcional.
 * `type="date"`/`type="time"` delegan en `DatePicker`/`TimePicker` (calendario
 * y selector de horario custom) sin cambiar la API — cualquier `<StyledInput
 * type="date" {...register(...)} />` existente se actualiza solo.
 */
export function StyledInput({ error, ...props }) {
  if (props.type === 'date') return <DatePicker error={error} {...props} />;
  if (props.type === 'time') return <TimePicker error={error} {...props} />;
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

/**
 * Select con el estilo estándar de los formularios, con estado de error opcional.
 *
 * Por debajo sigue siendo un `<select>` real (recibe `children`/`register()`/
 * `value`+`onChange` exactamente igual que antes) — pero visualmente queda
 * oculto vía clip (no `display:none`, sigue en el árbol de accesibilidad y
 * lo encuentran `getByRole('combobox')`/`getByLabelText` de los tests
 * existentes) y se reemplaza por un listbox custom animado. El listbox lee
 * las opciones resueltas del DOM del `<select>` (`selectRef.current.options`)
 * en vez de parsear `children`, así funciona igual si las opciones vienen de
 * un `.map()` o de un sub-componente como `<DocTypeOptions />`. Al elegir una
 * opción, escribe en el `<select>` real con `setNativeValue` — dispara un
 * evento `change` nativo, así que tanto un `onChange` pasado directo como el
 * que devuelve `register()` de react-hook-form lo reciben sin cambios.
 */
export function StyledSelect({ error, className, children, ref: forwardedRef, ...props }) {
  const selectRef = useRef(null);
  const {
    open, toggle, closePopover, position, triggerRef, popoverRef,
  } = usePickerPopover({ width: 260, height: 260 });
  const [options, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const next = Array.from(el.options).map((o) => ({ value: o.value, label: o.text, disabled: o.disabled }));
    setOptions((prev) => {
      const same = prev.length === next.length
        && prev.every((o, i) => o.value === next[i].value && o.label === next[i].label && o.disabled === next[i].disabled);
      return same ? prev : next;
    });
    setCurrentValue(el.value);
  });

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === currentValue);
    setHighlighted(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function selectOption(opt) {
    if (opt.disabled) return;
    setNativeValue(selectRef.current, opt.value);
    closePopover();
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(e) {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      toggle();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[highlighted]) selectOption(options[highlighted]);
    }
  }

  const selectedOption = options.find((o) => o.value === currentValue);
  const isPlaceholder = !currentValue;

  return (
    <div className="csf-picker">
      <select ref={mergeRefs(selectRef, forwardedRef)} tabIndex={-1} className="csf-native-hidden" {...props}>
        {children}
      </select>
      <button
        ref={triggerRef}
        type="button"
        className={[
          'csf-picker-trigger',
          'csf-dropdown-trigger',
          error && 'csf-picker-trigger--error',
          className,
        ].filter(Boolean).join(' ')}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={isPlaceholder ? 'csf-picker-placeholder' : ''}>
          {selectedOption?.label || 'Seleccionar...'}
        </span>
        <ChevronDown size={14} strokeWidth={2} />
      </button>

      {open && createPortal(
        <ul
          ref={popoverRef}
          className="csf-dropdown-popover"
          role="listbox"
          aria-label="Opciones"
          style={{ top: position.top, left: position.left, minWidth: triggerRef.current?.offsetWidth }}
        >
          {options.map((opt, i) => (
            <li key={`${opt.value}-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === currentValue}
                disabled={opt.disabled}
                className={[
                  'csf-dropdown-option',
                  i === highlighted && 'csf-dropdown-option--highlighted',
                  opt.value === currentValue && 'csf-dropdown-option--selected',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => selectOption(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === currentValue && <Check size={14} strokeWidth={2.5} />}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}

StyledSelect.propTypes = {
  error: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
