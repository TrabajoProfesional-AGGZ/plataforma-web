import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, Building2, Trophy } from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import texto from '../../assets/texto.png';
import logoSocio from '../../assets/logo_socio.png';
import './AppLayout.css';

const NAV_ITEMS_BASE = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, permiso: null },
  { to: '/socios', label: 'Socios', Icon: Users, permiso: 'ver_socios' },
  { to: '/usuarios', label: 'Usuarios', Icon: ShieldCheck, permiso: 'ver_usuarios' },
  { to: '/instalaciones', label: 'Reservas e Instalaciones', Icon: Building2, permiso: 'ver_instalaciones' },
  { to: '/disciplinas', label: 'Disciplinas', Icon: Trophy, permiso: 'ver_disciplinas' },
];

function AppLayout() {
  const { user, permisos } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const navItems = NAV_ITEMS_BASE.filter(n => !n.permiso || permisos.includes(n.permiso));

  return (
    <div className="app-layout">
      <aside className={`app-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="sidebar-toggle"
            aria-label="Alternar menú lateral"
          >
            <img src={logoSocio} alt="SocioUnido" className="sidebar-logo-icon" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={26} aria-hidden="true" />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && <p>SocioUnido v1.0</p>}
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <button className="app-header-logo-btn" onClick={() => navigate('/dashboard')}>
            <img src={texto} alt="SocioUnido" className="app-header-logo" />
          </button>
          <div className="app-header-actions">
            <div className="app-user-dropdown" ref={dropdownRef}>
              <button
                className="app-email-button"
                onClick={() => setDropdownOpen(v => !v)}
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

        <main className="app-content">
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
