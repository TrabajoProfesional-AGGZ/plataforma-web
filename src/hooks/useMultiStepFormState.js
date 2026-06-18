import { useState } from 'react';

export function useMultiStepFormState() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [navGuard, setNavGuard] = useState(false);

  const advance = () => {
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
