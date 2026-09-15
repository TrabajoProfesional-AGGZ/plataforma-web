import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowUpRight } from 'lucide-react';
import { SECCIONES } from '../../navigation';
import './DashboardPage.css';

/** Panel principal: grilla de accesos rápidos a las secciones habilitadas por permiso. */
function DashboardPage() {
  const navigate = useNavigate();
  const { user, permisos } = useAuth();

  const secciones = SECCIONES.filter(s => s.enDashboard !== false && (!s.permiso || permisos.includes(s.permiso)));

  return (
    <div className="dashboard-main">
      <h1 className="page-title page-title--display">Panel principal</h1>
      <p className="dashboard-subtitle">Bienvenido, <strong>{user?.email}</strong>. Accedé rápidamente a las secciones del sistema.</p>

      <div className="dashboard-grid">
        {secciones.map(s => {
          const Icon = s.Icon;
          return (
            <button
              key={s.label}
              className="dashboard-card"
              onClick={() => navigate(s.to)}
            >
              <div className="dashboard-card-top">
                <span className="dashboard-card-icon"><Icon size={20} aria-hidden="true" /></span>
                <span className="dashboard-card-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span>
              </div>
              <span className="dashboard-card-titulo">{s.label}</span>
              <span className="dashboard-card-descripcion">{s.descripcion}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default DashboardPage;
