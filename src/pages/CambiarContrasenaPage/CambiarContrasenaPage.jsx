import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, logout } from '../../services/authService';
import './CambiarContrasenaPage.css';

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="cambiar-contrasena-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrapper">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="toggle-password"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  );
}

function CambiarContrasenaPage() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

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

  return (
    <div className="cambiar-contrasena-page">
      <h1 className="cambiar-contrasena-title">Cambiar contraseña</h1>
      <form onSubmit={handleSubmit} className="cambiar-contrasena-form">
        <PasswordField
          id="actual"
          label="Contraseña actual"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          autoComplete="current-password"
        />
        <PasswordField
          id="nueva"
          label="Nueva contraseña"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirmar"
          label="Confirmar nueva contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
        />
        {error && (
          <p className="cambiar-contrasena-error" role="alert">
            {error}
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
