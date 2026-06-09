import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import texto from '../../assets/texto.png';
import logoSocio from '../../assets/logo_socio.png';
import './AppLayout.css';

function AppLayout() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const dropdownRef = useRef(null);
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
        <button
          className="app-header-logo-button"
          onClick={() => navigate('/dashboard')}
          aria-label="Ir al dashboard"
        >
          <img src={texto} alt="SocioUnido" className="app-header-logo" />
        </button>
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
          {navigating ? (
            <div className="app-page-loading">
              <img src={logoSocio} alt="" className="loading-logo" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
