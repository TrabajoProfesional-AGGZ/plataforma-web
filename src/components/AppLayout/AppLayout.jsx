import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { SECCIONES, seccionPorRuta } from '../../navigation';
import './AppLayout.css';

/**
 * Layout principal de la aplicación autenticada: sidebar de navegación
 * (drawer off-canvas en mobile), header con logo/usuario/logout, y el
 * `Outlet` de react-router donde se renderiza la página activa.
 */
function AppLayout() {
  const { user, permisos } = useAuth();
  const { theme, toggleTheme, logoSocio, logoTexto } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const indicadorSinPosicionRef = useRef(true);
  const snapFrameRef = useRef(null);
  const contentRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useBackToRoot(drawerOpen, false, () => setDrawerOpen(false));
  useDocumentTitle(seccionPorRuta(location.pathname)?.label);

  // Ubica el fondo del ítem activo (`.sidebar-active-bg`) sobre el link
  // actual. El deslizamiento lo hace la `transition` de CSS en una sola
  // pasada, sin importar cuántos ítems haya entre origen y destino. Con
  // `snap` se agrega `--snap` (transition: none) para que el cambio sea
  // instantáneo, y se la quita en el siguiente frame para que la próxima
  // navegación vuelva a animar.
  const posicionarIndicador = useCallback((snap) => {
    if (!navRef.current || !indicatorRef.current) return;
    const activo = navRef.current.querySelector('.sidebar-link.active');
    if (!activo) return;
    const el = indicatorRef.current;
    if (snap) {
      el.classList.add('sidebar-active-bg--snap');
      if (snapFrameRef.current) cancelAnimationFrame(snapFrameRef.current);
    }
    el.style.transform = `translateY(${activo.offsetTop}px)`;
    el.style.height = `${activo.offsetHeight}px`;
    el.style.opacity = '1';
    indicadorSinPosicionRef.current = false;
    if (snap) {
      snapFrameRef.current = requestAnimationFrame(() => {
        el.classList.remove('sidebar-active-bg--snap');
        snapFrameRef.current = null;
      });
    }
  }, []);

  // En el primer render (sin posición previa) se ubica sin animar; en cada
  // cambio de ruta, la transición de CSS lo desliza al link nuevo.
  useLayoutEffect(() => {
    posicionarIndicador(indicadorSinPosicionRef.current);
  }, [location.pathname, posicionarIndicador]);

  // Reposiciona el indicador sin animar al redimensionar la ventana (o
  // hacer zoom): `offsetTop`/`offsetHeight` de los links cambian con el
  // layout y la posición calculada en el último render queda obsoleta.
  useEffect(() => {
    const handleResize = () => posicionarIndicador(true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (snapFrameRef.current) cancelAnimationFrame(snapFrameRef.current);
    };
  }, [posicionarIndicador]);

  // Marca el header con --scrolled cuando el contenido dejó de estar al tope
  // (borde + sombra recién ahí). Se lee el scrollTop en un rAF para no hacer
  // trabajo en cada evento de scroll.
  useEffect(() => {
    const contenido = contentRef.current;
    if (!contenido) return;
    let frame = null;
    const handleScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setScrolled(contenido.scrollTop > 4);
      });
    };
    contenido.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      contenido.removeEventListener('scroll', handleScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  // Cierra el drawer mobile automáticamente al navegar a otra ruta.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Cierra el drawer con la tecla Escape mientras está abierto.
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

  // Filtra los ítems de la sidebar según los permisos del usuario logueado.
  const navItems = SECCIONES.filter(n => !n.permiso || permisos.includes(n.permiso));

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
          <button
            type="button"
            className="sidebar-theme-toggle"
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Principal" ref={navRef}>
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
        <header className={`app-header${scrolled ? ' app-header--scrolled' : ''}`}>
          <button
            className="app-header-menu-btn"
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={24} aria-hidden="true" />
          </button>
          <button className="app-header-logo-btn" onClick={() => navigate('/dashboard')}>
            <img src={logoTexto} alt="SocioUnido" className="app-header-logo" />
          </button>
          <div className="app-header-actions">
            <span className="app-email-text">{user?.email}</span>
            <button className="app-logout-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="app-content" ref={contentRef}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
