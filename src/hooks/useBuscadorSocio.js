import { useState } from 'react';
import { getSocioByNroSocio } from '../services/sociosService';

/**
 * Hook de búsqueda de un socio por número, con preview no bloqueante y
 * reutilización del preview ya resuelto al confirmar la búsqueda.
 * @returns {{
 *   nroSocioInput: string,
 *   busquedaSocio: boolean,
 *   errorSocio: string,
 *   socioSeleccionado: object|null,
 *   handleNroSocioChange: (value: string) => void,
 *   previewSocio: (value: string) => Promise<void>,
 *   buscarSocio: () => Promise<void>
 * }}
 */
export function useBuscadorSocio() {
  const [nroSocioInput, setNroSocioInput] = useState('');
  const [busquedaSocio, setBusquedaSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState('');
  const [socioPreview, setSocioPreview] = useState(null);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);

  const handleNroSocioChange = (value) => {
    setNroSocioInput(value);
    setSocioPreview(null);
    setSocioSeleccionado(null);
    setErrorSocio('');
  };

  const previewSocio = async (value) => {
    if (!value?.trim()) return;
    try {
      const socio = await getSocioByNroSocio(value.trim());
      setSocioPreview(socio);
    } catch {
      // el preview falla en silencio, no muestra error al usuario
    }
  };

  const buscarSocio = async () => {
    const nro = nroSocioInput.trim();
    if (!nro) return;

    const socioYaResuelto = socioPreview?.nro_socio === nro ? socioPreview : null;
    if (socioYaResuelto) {
      setSocioSeleccionado(socioYaResuelto);
      setErrorSocio('');
      return;
    }

    setBusquedaSocio(true);
    setErrorSocio('');
    try {
      const socio = await getSocioByNroSocio(nro);
      setSocioSeleccionado(socio);
    } catch {
      setErrorSocio('No se encontró ningún socio con ese número.');
    } finally {
      setBusquedaSocio(false);
    }
  };

  return {
    nroSocioInput,
    busquedaSocio,
    errorSocio,
    socioSeleccionado,
    handleNroSocioChange,
    previewSocio,
    buscarSocio,
  };
}
