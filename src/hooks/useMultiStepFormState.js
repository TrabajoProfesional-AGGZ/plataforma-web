import { useState } from 'react';

/**
 * Estado de navegación de un formulario multi-paso: paso actual, dirección de
 * la transición (para la animación) y bandera de envío.
 * @returns {{
 *   step: number, direction: 1|-1, submitted: boolean, setSubmitted: (v: boolean) => void,
 *   navGuard: boolean, advance: () => void, goBack: () => void
 * }}
 */
export function useMultiStepFormState() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [navGuard, setNavGuard] = useState(false);

  const advance = () => {
    // navGuard bloquea clicks durante la animación de transición entre pasos
    // (evita el click hijacking del paso siguiente mientras el actual se anima).
    setNavGuard(true);
    setDirection(1);
    setStep((s) => s + 1);
    setTimeout(() => setNavGuard(false), 300);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  return { step, direction, submitted, setSubmitted, navGuard, advance, goBack };
}
