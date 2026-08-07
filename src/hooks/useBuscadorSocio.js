import { useState } from 'react';
import { getSocioByNroSocio } from '../services/sociosService';

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
      // preview silently fails
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
