import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User } from 'lucide-react';
import { editarUsuario } from '../../services/usuariosService';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput } from '../createForm/FormFields';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { MAX_LEN } from '../../utils/formValidators';

const STEPS = [{ id: 1, label: 'Datos', icon: User }];

/**
 * Formulario de un paso para editar el nombre y apellido de un usuario
 * administrativo existente (el rol se cambia por separado, ver `CambiarRolForm`).
 * @param {{ usuario: object, onSuccess: (usuarioActualizado: object) => void, onCancel: () => void }} props
 */
export function EditUserForm({ usuario, onSuccess, onCancel }) {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
    },
  });

  const onSubmit = async (data) => {
    setFormError('');
    try {
      const actualizado = await editarUsuario(usuario.id, {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
      });
      setSubmitted(true);
      setTimeout(() => onSuccess(actualizado), 1800);
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
      title="Editar usuario"
      successTitle="¡Datos actualizados!"
      successMessage="Los cambios fueron guardados correctamente."
      submitLabel="Guardar cambios"
      submitLoadingLabel="Guardando..."
      onCancel={onCancel}
      goBack={() => {}}
      goNext={() => {}}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <div className="csf-fields">
        <Field id="edit-nombre" label="Nombre" icon={User} error={errors.nombre?.message}>
          <StyledInput
            id="edit-nombre"
            maxLength={MAX_LEN.NOMBRE}
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              maxLength: { value: MAX_LEN.NOMBRE, message: `El nombre no puede superar los ${MAX_LEN.NOMBRE} caracteres` },
            })}
            placeholder="ej: Juan"
            error={!!errors.nombre}
          />
        </Field>
        <Field id="edit-apellido" label="Apellido" icon={User} error={errors.apellido?.message}>
          <StyledInput
            id="edit-apellido"
            maxLength={MAX_LEN.APELLIDO}
            {...register('apellido', {
              required: 'El apellido es obligatorio',
              maxLength: { value: MAX_LEN.APELLIDO, message: `El apellido no puede superar los ${MAX_LEN.APELLIDO} caracteres` },
            })}
            placeholder="ej: Pérez"
            error={!!errors.apellido}
          />
        </Field>
        {formError && (
          <p className="csf-form-error" role="alert">{formError}</p>
        )}
      </div>
    </MultiStepFormShell>
  );
}
