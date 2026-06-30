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
  const [navigating, setNavigating] = useState(false);
  const dropdownRef = useRef(null);
  const isFirstRender = useRef(true);

  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const prevActiveIndexRef = useRef(-1);
  const animTimersRef = useRef([]);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!navRef.current || !indicatorRef.current) return;

    const linkEls = Array.from(navRef.current.querySelectorAll('.sidebar-link'));
    const to = linkEls.findIndex(el => el.classList.contains('active'));
    if (to === -1) return;

    const from = prevActiveIndexRef.current;
    const el = indicatorRef.current;

    animTimersRef.current.forEach(clearTimeout);
    animTimersRef.current = [];

    const snap = (idx) => {
      el.style.transition = 'none';
      el.style.transform = `translateY(${linkEls[idx].offsetTop}px)`;
      el.style.height = `${linkEls[idx].offsetHeight}px`;
      el.style.opacity = '1';
    };

    const slide = (idx) => {
      el.style.transition = 'transform 0.07s ease-out';
      el.style.transform = `translateY(${linkEls[idx].offsetTop}px)`;
      el.style.height = `${linkEls[idx].offsetHeight}px`;
    };

    if (from === -1) {
      snap(to);
      prevActiveIndexRef.current = to;
      return;
    }

    if (from === to) return;

    const step = from < to ? 1 : -1;
    let current = from + step;

    const doStep = () => {
      slide(current);
      if (current !== to) {
        current += step;
        const t = setTimeout(doStep, 50);
        animTimersRef.current.push(t);
      } else {
        prevActiveIndexRef.current = to;
      }
    };

    doStep();
  }, [location.pathname]);

  useEffect(() => {
    return () => { animTimersRef.current.forEach(clearTimeout); };
  }, []);

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
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <img src={logoSocio} alt="SocioUnido" className="sidebar-logo-icon" />
        </div>

        <nav className="sidebar-nav" ref={navRef}>
          <div ref={indicatorRef} className="sidebar-active-bg" />
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={26} aria-hidden="true" />
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>SocioUnido v1.0</p>
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
