import { useRef, useState } from 'react';
import { validarArchivoImagen } from '../utils/formValidators';

export function useImagenUpload() {
  const fileInputRef = useRef(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [archivoDataUrl, setArchivoDataUrl] = useState(null);
  const [estadoImagen, setEstadoImagen] = useState('vacio');
  const [errorImagen, setErrorImagen] = useState('');

  const handleArchivoSeleccionado = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const errorValidacion = validarArchivoImagen(file);
    if (errorValidacion) {
      setErrorImagen(errorValidacion);
      setEstadoImagen('error');
      setArchivoDataUrl(null);
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      setImagenPreview(lector.result);
      setArchivoDataUrl(lector.result);
      setEstadoImagen('lista');
      setErrorImagen('');
    };
    lector.readAsDataURL(file);
  };

  const subirSiCorresponde = async (subirFn) => {
    if (!archivoDataUrl) return null;

    setEstadoImagen('subiendo');
    setErrorImagen('');
    try {
      const { url } = await subirFn(archivoDataUrl);
      setEstadoImagen('exito');
      return url;
    } catch {
      setErrorImagen('No se pudo subir la imagen. Intentá de nuevo.');
      setEstadoImagen('error');
      throw new Error('upload-failed');
    }
  };

  return {
    fileInputRef,
    imagenPreview,
    estadoImagen,
    errorImagen,
    handleArchivoSeleccionado,
    subirSiCorresponde,
  };
}
