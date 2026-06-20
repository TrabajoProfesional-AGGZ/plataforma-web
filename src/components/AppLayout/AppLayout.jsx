import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, ChevronRight, Building2, Trophy } from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import texto from '../../assets/texto.png';
import logoSocio from '../../assets/logo_socio.png';
import './AppLayout.css';

const NAV_ITEMS_BASE = [
  { to: '/dashboard', label: 'Dashboard', desc: 'Inicio y resumen general', Icon: LayoutDashboard, permiso: null },
  { to: '/socios', label: 'Socios', desc: 'Consultar y gestionar el padrón', Icon: Users, permiso: 'ver_socios' },
  { to: '/usuarios', label: 'Usuarios', desc: 'Usuarios administrativos y roles', Icon: ShieldCheck, permiso: 'ver_usuarios' },
  { to: '/instalaciones', label: 'Reservas e Instalaciones', desc: 'Administrar espacios físicos y reservas', Icon: Building2, permiso: 'ver_instalaciones' },
  { to: '/disciplinas', label: 'Disciplinas', desc: 'Gestionar disciplinas del club', Icon: Trophy, permiso: 'ver_disciplinas' },
];

function AppLayout() {
  const { user, permisos } = useAuth();
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

  const navItems = NAV_ITEMS_BASE.filter(n => !n.permiso || permisos.includes(n.permiso));

  return (
    <div className="app-layout">
      {/* Backdrop */}
      <div
        className={`app-sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar overlay */}
      <nav className={`app-sidebar${sidebarOpen ? '' : ' hidden'}`}>
        <div className="app-sidebar-nav">
          {navItems.map(({ to, label, desc, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} aria-hidden="true" />
              <div className="sidebar-link-content">
                <span className="sidebar-link-label">{label}</span>
                <span className="sidebar-link-desc">{desc}</span>
              </div>
              <ChevronRight size={14} className="sidebar-link-chevron" aria-hidden="true" />
            </NavLink>
          ))}
        </div>

        <div className="app-sidebar-footer">
          <p>SocioUnido v1.0</p>
        </div>
      </nav>

      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
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
        </div>

        <div className="app-header-center">
          <button
            className="app-header-logo-button"
            onClick={() => navigate('/dashboard')}
            aria-label="Ir al dashboard"
          >
            <img src={texto} alt="SocioUnido" className="app-header-logo" />
          </button>
        </div>

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

      {/* Main */}
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
  );
}

export default AppLayout;
