import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, logout } from '../services/authService';
import { validarFortalezaPassword } from '../utils/formValidators';

export function useChangePassword() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errorFortaleza = validarFortalezaPassword(nueva);
    if (errorFortaleza) {
      setError(errorFortaleza);
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await changePassword(actual, nueva);
      await logout();
      navigate('/', { state: { passwordChanged: true } });
    } catch {
      setError('Contraseña actual incorrecta o error al cambiar contraseña');
      setLoading(false);
    }
  }

  return { actual, setActual, nueva, setNueva, confirmar, setConfirmar, error, loading, handleSubmit };
}
