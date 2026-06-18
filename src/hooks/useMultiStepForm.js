import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMultiStepFormState } from './useMultiStepFormState';

export function useMultiStepForm(stepFields, useFormOptions = { mode: 'onTouched' }) {
  const { step, direction, submitted, setSubmitted, navGuard, advance, goBack } = useMultiStepFormState();
  const [formError, setFormError] = useState('');
  const {
    register, handleSubmit, trigger, setValue,
    formState: { errors, isSubmitting },
  } = useForm(useFormOptions);

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    advance();
  };

  return {
    step, direction, submitted, setSubmitted, navGuard,
    goBack, goNext,
    formError, setFormError,
    register, handleSubmit, setValue, errors, isSubmitting,
  };
}
