import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import texto from '../../assets/texto.png';
import './AppLayout.css';

function AppLayout() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <img src={texto} alt="SocioUnido" className="app-header-logo" />
        <div className="app-header-user">
          <button className="app-logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
          <span className="app-header-user-info">{user?.email} · {role}</span>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-sidebar">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/socios" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            Socios
          </NavLink>
          <NavLink to="/cambiar-contrasena" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            Cambiar contraseña
          </NavLink>
          {role === 'superAdmin' && (
            <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              Usuarios
            </NavLink>
          )}
        </nav>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
