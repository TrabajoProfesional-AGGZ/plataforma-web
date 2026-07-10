import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, Building2, Trophy, Newspaper, Settings, BarChart3, Bell, Menu, Receipt, TrendingDown} from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import texto from '../../assets/texto.png';
import logoSocio from '../../assets/logo_socio.png';
import './AppLayout.css';


const NAV_ITEMS_BASE = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, permiso: null },
  { to: '/socios', label: 'Socios', Icon: Users, permiso: 'ver_socios' },
  { to: '/usuarios', label: 'Usuarios', Icon: ShieldCheck, permiso: 'ver_usuarios' },
  { to: '/finanzas', label: 'Finanzas', Icon: Receipt, permiso: 'ver_metricas' },
  { to: '/instalaciones', label: 'Reservas e Instalaciones', Icon: Building2, permiso: 'ver_instalaciones' },
  { to: '/disciplinas', label: 'Disciplinas', Icon: Trophy, permiso: 'ver_disciplinas' },
  { to: '/noticias', label: 'Noticias', Icon: Newspaper, permiso: 'ver_noticias' },
  { to: '/metricas', label: 'Métricas', Icon: BarChart3, permiso: 'ver_metricas' },
  { to: '/morosidad', label: 'Morosidad', Icon: TrendingDown, permiso: 'ver_metricas' },
  { to: '/alertas', label: 'Alertas', Icon: Bell, permiso: 'ver_alertas' },
  { to: '/perfil', label: 'Perfil', Icon: Settings, permiso: ''}
];

function AppLayout() {
  const { user, permisos } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const prevActiveIndexRef = useRef(-1);
  const animTimersRef = useRef([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      el.style.transition = 'transform 0.05s ease-out';
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
    function handleResize() {
      if (!navRef.current || !indicatorRef.current) return;
      const linkEls = Array.from(navRef.current.querySelectorAll('.sidebar-link'));
      const idx = linkEls.findIndex(el => el.classList.contains('active'));
      if (idx === -1) return;
      const el = indicatorRef.current;
      el.style.transition = 'none';
      el.style.transform = `translateY(${linkEls[idx].offsetTop}px)`;
      el.style.height = `${linkEls[idx].offsetHeight}px`;
      el.style.opacity = '1';
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const navItems = NAV_ITEMS_BASE.filter(n => !n.permiso || permisos.includes(n.permiso));

  return (
    <div className="app-layout">
      {drawerOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className={`app-sidebar${drawerOpen ? ' open' : ''}`}>
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
              onClick={() => setDrawerOpen(false)}
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
          <button
            className="app-header-menu-btn"
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={24} aria-hidden="true" />
          </button>
          <button className="app-header-logo-btn" onClick={() => navigate('/dashboard')}>
            <img src={texto} alt="SocioUnido" className="app-header-logo" />
          </button>
          <div className="app-header-actions">
            <span className="app-email-text">{user?.email}</span>
            <button className="app-logout-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
