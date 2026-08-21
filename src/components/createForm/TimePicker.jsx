import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Clock } from 'lucide-react';
import { setNativeValue, mergeRefs } from './nativeInputUtils';
import { usePickerPopover } from './usePickerPopover';
import './Pickers.css';

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function parseTime(str) {
  const match = /^(\d{2}):(\d{2})/.exec(str || '');
  return match ? { h: match[1], m: match[2] } : null;
}

/**
 * Selector de horario con dos columnas desplazables (hora / minuto, de a 5 en
 * 5) en vez del `<input type="time">` nativo. Mismo patrón que `DatePicker`:
 * un input real oculto por clip (accesible, no `display:none`) sigue siendo
 * la fuente de verdad para react-hook-form y los tests — las columnas solo
 * escriben ahí con `setNativeValue`.
 */
export function TimePicker({ error, className, disabled, placeholder, ref: forwardedRef, ...props }) {
  const inputRef = useRef(null);
  const {
    open, toggle, closePopover, position, triggerRef, popoverRef,
  } = usePickerPopover({ width: 172, height: 232 });
  const [value, setValue] = useState('');

  // Sin array de deps a propósito: re-lee `inputRef.current.value` en cada render, ya
  // que `commit`/`setNativeValue` escriben el input real fuera del ciclo de React.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setValue(inputRef.current?.value || '');
  });

  const parsed = parseTime(value);
  const label = parsed ? `${parsed.h}:${parsed.m}` : (placeholder || 'Seleccionar hora');

  function commit(h, m) {
    const next = `${h}:${m}`;
    setNativeValue(inputRef.current, next);
    setValue(next);
  }

  const currentH = parsed?.h ?? null;
  const currentM = parsed?.m ?? null;

  return (
    <div className="csf-picker">
      <input
        ref={mergeRefs(inputRef, forwardedRef)}
        type="time"
        className="csf-native-hidden"
        disabled={disabled}
        {...props}
      />
      <button
        ref={triggerRef}
        type="button"
        className={`csf-picker-trigger${error ? ' csf-picker-trigger--error' : ''}${className ? ` ${className}` : ''}`}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Clock size={15} strokeWidth={2} />
        <span className={parsed ? '' : 'csf-picker-placeholder'}>{label}</span>
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="csf-time-popover"
          role="dialog"
          aria-label="Elegir hora"
          style={{ top: position.top, left: position.left }}
        >
          <div className="csf-time-columns">
            <ul className="csf-time-col" role="listbox" aria-label="Hora">
              {HORAS.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={h === currentH}
                    className={`csf-time-option${h === currentH ? ' csf-time-option--selected' : ''}`}
                    onClick={() => commit(h, currentM ?? '00')}
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>
            <ul className="csf-time-col" role="listbox" aria-label="Minuto">
              {MINUTOS.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={m === currentM}
                    className={`csf-time-option${m === currentM ? ' csf-time-option--selected' : ''}`}
                    onClick={() => { commit(currentH ?? '00', m); closePopover(); }}
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

TimePicker.propTypes = {
  error: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};
