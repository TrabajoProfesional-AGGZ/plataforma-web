import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './PerfilPage.css';

function PerfilPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

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
        <button className="perfil-cambiar-button" onClick={() => navigate('/cambiar-contrasena')}>
          Cambiar contraseña
        </button>
      </div>
    </div>
  );
}

export default PerfilPage;
