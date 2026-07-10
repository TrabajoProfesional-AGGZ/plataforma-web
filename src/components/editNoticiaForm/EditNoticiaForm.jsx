import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { editarNoticia } from '../../services/noticiasService';
import { MAX_LEN } from '../../utils/formValidators';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';

const STEPS = [{ id: 1, label: 'Datos', icon: FileText }];

export function EditNoticiaForm({ noticia, onSuccess, onCancel }) {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      titulo: noticia.titulo ?? '',
      cuerpo: noticia.cuerpo ?? '',
    },
  });

  useEscapeKey(onCancel);

  const onSubmit = async (data) => {
    setFormError('');
    try {
      const actualizada = await editarNoticia(noticia.id, {
        titulo: data.titulo.trim(),
        cuerpo: data.cuerpo.trim(),
      });
      setSubmitted(true);
      setTimeout(() => onSuccess(actualizada), 1800);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setFormError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setFormError('Error al guardar los cambios. Intentá de nuevo.');
      }
    }
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={1}
      submitted={submitted}
      navGuard={false}
      isSubmitting={isSubmitting}
      title="Editar noticia"
      successTitle="¡Noticia actualizada!"
      successMessage="Los cambios fueron guardados correctamente."
      submitLabel="Guardar cambios"
      submitLoadingLabel="Guardando..."
      onCancel={onCancel}
      goBack={() => {}}
      goNext={() => {}}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <div className="csf-fields">
        <Field id="edit-titulo" label="Título" icon={FileText} error={errors.titulo?.message}>
          <StyledInput
            id="edit-titulo"
            {...register('titulo', {
              required: 'El título es obligatorio',
              maxLength: { value: MAX_LEN.TITULO_NOTICIA, message: `Máximo ${MAX_LEN.TITULO_NOTICIA} caracteres` },
            })}
            placeholder="Ej. Inauguración de nuevas instalaciones"
            error={!!errors.titulo}
          />
        </Field>
        <Field id="edit-cuerpo" label="Cuerpo" icon={FileText} error={errors.cuerpo?.message}>
          <textarea
            id="edit-cuerpo"
            {...register('cuerpo', {
              required: 'El cuerpo es obligatorio',
              maxLength: { value: MAX_LEN.CUERPO_NOTICIA, message: `Máximo ${MAX_LEN.CUERPO_NOTICIA} caracteres` },
            })}
            rows={5}
            className={`csf-input${errors.cuerpo ? ' csf-input-error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
        </Field>
        {formError && (
          <p className="csf-form-error" role="alert">{formError}</p>
        )}
      </div>
    </MultiStepFormShell>
  );
}
