import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { PermisosModal } from '../../components/permisosModal/PermisosModal';
import { Lock, Eye, EyeOff } from 'lucide-react';
import '../../components/createForm/CreateSocioForm.css';
import './PerfilPage.css';

function PasswordInput({ id, value, onChange, autoComplete, required }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="csf-input"
        style={{
          paddingRight: 48,
          background: focused ? '#ffffff' : '#f5f5f5',
          borderColor: focused ? '#111111' : 'transparent',
        }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#4a4a4a',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
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
    <div className="csf-overlay" onClick={onClose}>
      <div className="csf-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="csf-outer-card">
          <div className="csf-header">
            <h1>Cambiar contraseña</h1>
          </div>
          <div className="csf-card">
            <form onSubmit={handleSubmit}>
              <div className="csf-fields">
                <div className="csf-field">
                  <label className="csf-label" htmlFor="actual">
                    <Lock size={13} strokeWidth={2} />
                    Contraseña actual
                  </label>
                  <PasswordInput
                    id="actual"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="csf-field">
                  <label className="csf-label" htmlFor="nueva">
                    <Lock size={13} strokeWidth={2} />
                    Nueva contraseña
                  </label>
                  <PasswordInput
                    id="nueva"
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="csf-field">
                  <label className="csf-label" htmlFor="confirmar">
                    <Lock size={13} strokeWidth={2} />
                    Confirmar nueva contraseña
                  </label>
                  <PasswordInput
                    id="confirmar"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {error && (
                  <p className="csf-form-error" role="alert">{error}</p>
                )}
              </div>
              <div className="csf-nav csf-nav--between">
                <button type="button" className="csf-btn-back" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="csf-btn-submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerfilPage() {
  const { user, role, permisos } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [permisosModalOpen, setPermisosModalOpen] = useState(false);

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
        {permisos && permisos.length > 0 && (
          <button className="perfil-ver-permisos-button" onClick={() => setPermisosModalOpen(true)}>
            Ver permisos
          </button>
        )}
        <button className="perfil-cambiar-button" onClick={() => setModalOpen(true)}>
          Cambiar contraseña
        </button>
      </div>
      {modalOpen && <CambiarContrasenaModal onClose={cerrarModal} />}
      {permisosModalOpen && (
        <PermisosModal permisos={permisos} onClose={() => setPermisosModalOpen(false)} />
      )}
    </div>
  );
}

export default PerfilPage;
