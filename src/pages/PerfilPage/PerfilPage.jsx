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
        <div className="perfil-field">
          <span className="perfil-label">Email</span>
          <span className="perfil-value">{user?.email}</span>
        </div>
        <div className="perfil-field">
          <span className="perfil-label">Rol</span>
          <span className={`perfil-rol-badge perfil-rol-${role}`}>{role}</span>
        </div>
      </div>
      <button className="perfil-cambiar-button" onClick={() => navigate('/cambiar-contrasena')}>
        Cambiar contraseña
      </button>
    </div>
  );
}

export default PerfilPage;
