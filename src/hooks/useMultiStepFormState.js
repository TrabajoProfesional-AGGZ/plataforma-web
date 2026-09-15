import { useCallback, useRef, useState } from 'react';

/** Respaldo por si la animación del paso nunca termina (p. ej. reduced motion sin callback). */
const NAV_GUARD_FALLBACK_MS = 300;

/**
 * Estado de navegación de un formulario multi-paso: paso actual, dirección de
 * la transición (para la animación) y bandera de envío.
 *
 * `navGuard` bloquea el botón de submit desde que se llama a `advance()` hasta
 * que el paso nuevo terminó de entrar (`finNavGuard()`, cableado por
 * `MultiStepFormShell` al `onAnimationComplete` de `FormStep`). Evita el click
 * hijacking del paso siguiente (ver `.claude/BUGS.md`). Si nadie llama a
 * `finNavGuard()`, un `setTimeout` de respaldo lo libera igual.
 * @returns {{
 *   step: number, direction: 1|-1, submitted: boolean, setSubmitted: (v: boolean) => void,
 *   navGuard: boolean, finNavGuard: () => void, advance: () => void, goBack: () => void
 * }}
 */
export function useMultiStepFormState() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [navGuard, setNavGuard] = useState(false);
  const fallbackRef = useRef(null);

  const finNavGuard = useCallback(() => {
    clearTimeout(fallbackRef.current);
    fallbackRef.current = null;
    setNavGuard(false);
  }, []);

  const advance = () => {
    setNavGuard(true);
    setDirection(1);
    setStep((s) => s + 1);
    clearTimeout(fallbackRef.current);
    fallbackRef.current = setTimeout(finNavGuard, NAV_GUARD_FALLBACK_MS);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  return { step, direction, submitted, setSubmitted, navGuard, finNavGuard, advance, goBack };
}
