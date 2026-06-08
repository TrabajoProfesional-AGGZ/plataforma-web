import { useState } from 'react';
import { changePassword } from '../../services/authService';
import './CambiarContrasenaPage.css';

function CambiarContrasenaPage() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito(false);

    if (nueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword(actual, nueva);
      setExito(true);
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch {
      setError('Contraseña actual incorrecta o error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cambiar-contrasena-page">
      <h1 className="cambiar-contrasena-title">Cambiar contraseña</h1>
      <form onSubmit={handleSubmit} className="cambiar-contrasena-form">
        <div className="cambiar-contrasena-field">
          <label htmlFor="actual">Contraseña actual</label>
          <input
            id="actual"
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="cambiar-contrasena-field">
          <label htmlFor="nueva">Nueva contraseña</label>
          <input
            id="nueva"
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="cambiar-contrasena-field">
          <label htmlFor="confirmar">Confirmar nueva contraseña</label>
          <input
            id="confirmar"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="cambiar-contrasena-error" role="alert">
            {error}
          </p>
        )}
        {exito && (
          <p className="cambiar-contrasena-exito" role="status">
            Contraseña actualizada correctamente
          </p>
        )}
        <button type="submit" className="cambiar-contrasena-button" disabled={loading}>
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}

export default CambiarContrasenaPage;
