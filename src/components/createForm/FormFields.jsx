import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -52 : 52, opacity: 0 }),
};

export function FieldError({ message }) {
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

export function Field({ id, label, icon: Icon, error, children }) {
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

export function StyledInput({ error, ...props }) {
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

export function StyledSelect({ error, children, ...props }) {
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
