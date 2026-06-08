import { useRef, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import texto from '../../assets/texto.png';
import logoSocio from '../../assets/logo_socio.png';
import './AppLayout.css';

function AppLayout() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <button
          className="app-sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Alternar menú lateral"
        >
          <img
            src={logoSocio}
            alt=""
            className={`app-header-logo-icon${sidebarOpen ? ' logo-rotated' : ''}`}
          />
        </button>
        <img src={texto} alt="SocioUnido" className="app-header-logo" />
        <div className="app-header-right">
          <div className="app-user-dropdown" ref={dropdownRef}>
            <button
              className="app-email-button"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              {user?.email}
            </button>
            {dropdownOpen && (
              <div className="app-dropdown-menu">
                <button
                  className="app-dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate('/perfil'); }}
                >
                  Ver perfil
                </button>
              </div>
            )}
          </div>
          <button className="app-logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className={sidebarOpen ? 'app-sidebar' : 'app-sidebar hidden'}>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/socios" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            Socios
          </NavLink>
          {role === 'superAdmin' && (
            <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              Usuarios
            </NavLink>
          )}
        </nav>

        <main className="app-content" onClick={() => setSidebarOpen(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
