import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { SPRING } from '../../styles/motion';
import './BuscadorColapsable.css';

/**
 * Buscador colapsado a una lupa: al apretarla se despliega el input + "Buscar".
 * Controlado desde la página (`abierto`/`onToggle`) para que "Ver todos" pueda
 * cerrarlo. Escape cierra y devuelve el foco a la lupa.
 */
export function BuscadorColapsable({
  abierto, onToggle, value, onChange, onSubmit, placeholder, disabled = false, maxLength, label = 'Abrir búsqueda',
}) {
  const inputRef = useRef(null);
  const lupaRef = useRef(null);

  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onToggle();
      lupaRef.current?.focus();
    }
  }

  return (
    <div className="buscador">
      <button
        ref={lupaRef}
        type="button"
        className={`icon-btn buscador-lupa${abierto ? ' buscador-lupa--activa' : ''}`}
        aria-label={label}
        aria-expanded={abierto}
        onClick={onToggle}
      >
        <Search size={18} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.form
            className="buscador-form"
            onSubmit={onSubmit}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={SPRING.quick}
          >
            <input
              ref={inputRef}
              className="buscador-input"
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
            />
            <button type="submit" className="buscador-submit" disabled={disabled || !value.trim()}>
              Buscar
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BuscadorColapsable;
