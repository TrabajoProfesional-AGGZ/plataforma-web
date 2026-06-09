import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import './PerfilPage.css';

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="modal-field">
      <label className="modal-label" htmlFor={id}>{label}</label>
      <div className="perfil-password-wrapper">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="modal-input perfil-password-input"
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="perfil-toggle-password"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  );
}

function CambiarContrasenaModal({ onClose }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Cambiar contraseña</h2>
        <form onSubmit={handleSubmit}>
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
            <p className="modal-error" role="alert">{error}</p>
          )}
          <div className="modal-actions">
            <button type="button" className="modal-button-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-button-submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PerfilPage() {
  const { user, role } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const cerrarModal = useCallback(() => setModalOpen(false), []);

  return (
    <div className="perfil-page">
      <h1 className="perfil-title">Mi perfil</h1>
      <div className="perfil-card">
        <div className="perfil-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
        <div className="perfil-fields">
          <div className="perfil-field">
            <span className="perfil-label">Email</span>
            <span className="perfil-value">{user?.email}</span>
          </div>
          <div className="perfil-field">
            <span className="perfil-label">Rol</span>
            <span className={`perfil-rol-badge perfil-rol-${role}`}>{role}</span>
          </div>
        </div>
      </div>
      <div className="perfil-actions">
        <button className="perfil-cambiar-button" onClick={() => setModalOpen(true)}>
          Cambiar contraseña
        </button>
      </div>
      {modalOpen && <CambiarContrasenaModal onClose={cerrarModal} />}
    </div>
  );
}

export default PerfilPage;
