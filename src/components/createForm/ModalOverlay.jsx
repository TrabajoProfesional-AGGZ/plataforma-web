import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useModalHistory } from '../../hooks/useModalHistory';
import './CreateSocioForm.css';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Primitivo de modal único del proyecto: overlay con bloqueo de scroll del body,
 * focus trap (Tab/Shift+Tab dentro del contenido), cierre con ESC o click fuera,
 * restauración del foco previo al desmontar, y soporte del gesto de "atrás" del
 * celular vía `useModalHistory`.
 */
export function ModalOverlay({ onClose, wrapperClass, children, ariaLabel, ariaLabelledBy }) {
  const wrapperRef = useRef(null);

  useModalHistory(onClose);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    wrapperRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !wrapperRef.current) return;
      const focusables = wrapperRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="csf-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={wrapperRef}
        className={['csf-wrapper', wrapperClass].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

ModalOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  wrapperClass: PropTypes.string,
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  ariaLabelledBy: PropTypes.string,
};
