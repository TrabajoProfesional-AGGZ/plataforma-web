import { useForm } from 'react-hook-form';
import { ShoppingBag, DollarSign, Package } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { ImagenUploadField } from '../createForm/ImagenUploadField';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useImagenUpload } from '../../hooks/useImagenUpload';
import { subirImagenProducto, editarProducto } from '../../services/productosService';

const STEPS = [{ id: 1, label: 'Datos', icon: ShoppingBag }];

const TEXTO_ESTADO_IMAGEN = {
  vacio: { titulo: 'Cambiar foto del producto', hint: 'JPG, PNG o WEBP, hasta 5MB' },
  lista: { titulo: 'Cambiar imagen', hint: 'Se subirá al guardar' },
  subiendo: { titulo: 'Subiendo imagen...', hint: 'Subiendo...' },
  exito: { titulo: 'Cambiar imagen', hint: 'Imagen actualizada' },
  error: { titulo: 'Reintentar', hint: 'No se pudo cargar la imagen' },
};

/**
 * Formulario de un paso para editar un producto existente, pre-rellenado con
 * `defaultValues` a partir de `producto`. Solo sube una imagen nueva a
 * Cloudinary si el usuario eligió un archivo (`useImagenUpload`); si no,
 * mantiene la `imagen_url` existente como preview y no la reenvía en el payload.
 * @param {{ producto: object, onSuccess: (productoActualizado: object) => void, onCancel: () => void }} props
 */
export function EditProductoForm({ producto, onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();
  const {
    fileInputRef, imagenPreview, estadoImagen, errorImagen,
    handleArchivoSeleccionado, subirSiCorresponde,
  } = useImagenUpload();

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
    },
  });

  const onSubmit = async (data) => {
    let imagenUrl;
    try {
      imagenUrl = await subirSiCorresponde((dataUrl) => subirImagenProducto(dataUrl));
    } catch {
      return;
    }

    const payload = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      precio: parseFloat(data.precio),
      stock: parseInt(data.stock, 10),
    };
    if (imagenUrl) payload.imagen_url = imagenUrl;

    try {
      const actualizado = await editarProducto(producto.id, payload);
      setSubmitted(true);
      await new Promise((r) => setTimeout(r, 1200));
      onSuccess(actualizado);
    } catch {
      // No hay mensaje de error visible para este caso: el formulario simplemente
      // no avanza a la pantalla de éxito y el usuario puede reintentar.
    }
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Editar producto"
      successTitle="¡Producto actualizado!"
      successMessage="Los cambios fueron guardados."
      submitLabel="Guardar cambios"
      submitLoadingLabel="Guardando..."
      onCancel={onCancel}
      goBack={() => {}}
      goNext={() => {}}
      direction={direction}
      onFormSubmit={handleSubmit(onSubmit)}
    >
      <FormStep key="step1" direction={direction}>
        <Field label="Nombre" icon={ShoppingBag} error={errors.nombre?.message}>
          <StyledInput
            {...register('nombre', {
              required: 'El nombre es requerido',
              maxLength: { value: 150, message: 'Máximo 150 caracteres' },
            })}
            error={!!errors.nombre}
          />
        </Field>
        <Field label="Descripción" icon={ShoppingBag} error={errors.descripcion?.message}>
          <textarea
            {...register('descripcion', {
              maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
            })}
            rows={4}
            className={`csf-input${errors.descripcion ? ' csf-input--error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
        </Field>
        <Field label="Precio ($)" icon={DollarSign} error={errors.precio?.message}>
          <StyledInput
            {...register('precio', {
              required: 'El precio es requerido',
              min: { value: 0, message: 'No puede ser negativo' },
            })}
            type="number"
            step="0.01"
            error={!!errors.precio}
          />
        </Field>
        <Field label="Stock" icon={Package} error={errors.stock?.message}>
          <StyledInput
            {...register('stock', {
              required: 'El stock es requerido',
              min: { value: 0, message: 'No puede ser negativo' },
            })}
            type="number"
            error={!!errors.stock}
          />
        </Field>
        <ImagenUploadField
          label="Foto del producto"
          fieldName="imagen_url"
          register={register}
          error={errorImagen || errors.imagen_url?.message}
          fileInputRef={fileInputRef}
          estadoImagen={estadoImagen}
          imagenPreview={imagenPreview || producto.imagen_url}
          onFileChange={handleArchivoSeleccionado}
          textoEstado={TEXTO_ESTADO_IMAGEN}
        />
      </FormStep>
    </MultiStepFormShell>
  );
}

EditProductoForm.propTypes = {
  producto: PropTypes.object.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};