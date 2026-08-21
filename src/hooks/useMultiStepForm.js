import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMultiStepFormState } from './useMultiStepFormState';

const DEFAULT_FORM_OPTIONS = { mode: 'onTouched' };

/**
 * Combina `react-hook-form` con `useMultiStepFormState`: valida solo los campos
 * del paso actual antes de avanzar.
 * @param {string[][]} stepFields - Nombres de campos a validar por cada paso, indexado por `step`.
 * @param {import('react-hook-form').UseFormProps} [useFormOptions] - Opciones para `useForm`.
 * @returns {ReturnType<typeof useMultiStepFormState> & {
 *   goNext: () => Promise<void>,
 *   formError: string, setFormError: (v: string) => void,
 *   register: Function, handleSubmit: Function, setValue: Function,
 *   errors: object, isSubmitting: boolean
 * }}
 */
export function useMultiStepForm(stepFields, useFormOptions = DEFAULT_FORM_OPTIONS) {
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
