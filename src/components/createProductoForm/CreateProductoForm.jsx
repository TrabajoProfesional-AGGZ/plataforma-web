import { useForm } from 'react-hook-form';
import { ShoppingBag, DollarSign, Package } from 'lucide-react';
import PropTypes from 'prop-types';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput, FormStep } from '../createForm/FormFields';
import { ImagenUploadField } from '../createForm/ImagenUploadField';
import { MultiStepFormShell } from '../createForm/MultiStepFormShell';
import { useMultiStepFormState } from '../../hooks/useMultiStepFormState';
import { useImagenUpload } from '../../hooks/useImagenUpload';
import { subirImagenProducto } from '../../services/productosService';

const STEPS = [{ id: 1, label: 'Datos', icon: ShoppingBag }];

const TEXTO_ESTADO_IMAGEN = {
  vacio: { titulo: 'Subir foto del producto', hint: 'JPG, PNG o WEBP, hasta 5MB' },
  lista: { titulo: 'Cambiar imagen', hint: 'Se subirá al crear el producto' },
  subiendo: { titulo: 'Subiendo imagen...', hint: 'Subiendo...' },
  exito: { titulo: 'Cambiar imagen', hint: 'Imagen cargada correctamente' },
  error: { titulo: 'Reintentar', hint: 'No se pudo cargar la imagen' },
};

/**
 * Formulario de un paso para crear un producto de la tienda. La foto (opcional)
 * se elige antes pero se sube a Cloudinary recién al confirmar el envío
 * (`useImagenUpload`) — si la subida falla, el envío se aborta.
 * @param {{ onSuccess: (payload: object) => void, onCancel: () => void }} props
 */
export function CreateProductoForm({ onSuccess, onCancel }) {
  const { step, direction, submitted, setSubmitted, navGuard } = useMultiStepFormState();
  const {
    fileInputRef, imagenPreview, estadoImagen, errorImagen,
    handleArchivoSeleccionado, subirSiCorresponde,
  } = useImagenUpload();

  const {
    register, handleSubmit, setValue,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
    let imagenUrl;
    try {
      imagenUrl = await subirSiCorresponde((dataUrl) => subirImagenProducto(dataUrl));
    } catch {
      return;
    }
    if (imagenUrl) setValue('imagen_url', imagenUrl, { shouldValidate: true });

    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 1800));
    onSuccess({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      precio: parseFloat(data.precio),
      stock: parseInt(data.stock, 10),
      imagen_url: imagenUrl ?? null,
    });
  };

  return (
    <MultiStepFormShell
      steps={STEPS}
      step={step}
      submitted={submitted}
      navGuard={navGuard}
      isSubmitting={isSubmitting}
      title="Nuevo producto"
      successTitle="¡Producto creado!"
      successMessage="El producto fue agregado a la tienda."
      submitLabel="Crear producto"
      submitLoadingLabel="Creando..."
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
            placeholder="Ej. Remera oficial del club"
            error={!!errors.nombre}
          />
        </Field>
        <Field label="Descripción (opcional)" icon={ShoppingBag} error={errors.descripcion?.message}>
          <textarea
            {...register('descripcion', {
              maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
            })}
            placeholder="Describí el producto..."
            rows={4}
            className={`csf-input${errors.descripcion ? ' csf-input--error' : ''}`}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
          />
        </Field>
        <Field label="Precio ($)" icon={DollarSign} error={errors.precio?.message}>
          <StyledInput
            {...register('precio', {
              required: 'El precio es requerido',
              min: { value: 0, message: 'El precio no puede ser negativo' },
            })}
            type="number"
            step="0.01"
            placeholder="Ej. 15000"
            error={!!errors.precio}
          />
        </Field>
        <Field label="Stock" icon={Package} error={errors.stock?.message}>
          <StyledInput
            {...register('stock', {
              required: 'El stock es requerido',
              min: { value: 0, message: 'El stock no puede ser negativo' },
            })}
            type="number"
            placeholder="Ej. 50"
            error={!!errors.stock}
          />
        </Field>
        <ImagenUploadField
          label="Foto del producto (opcional)"
          fieldName="imagen_url"
          register={register}
          error={errorImagen || errors.imagen_url?.message}
          fileInputRef={fileInputRef}
          estadoImagen={estadoImagen}
          imagenPreview={imagenPreview}
          onFileChange={handleArchivoSeleccionado}
          textoEstado={TEXTO_ESTADO_IMAGEN}
        />
      </FormStep>
    </MultiStepFormShell>
  );
}

CreateProductoForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};