import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, ShieldCheck, Calendar, Trophy, ArrowUpRight } from 'lucide-react';
import './DashboardPage.css';

const SECCIONES = [
  {
    path: '/socios',
    titulo: 'Socios',
    descripcion: 'Crear nuevos socios y consultar el padrón.',
    Icon: Users,
    rol: null,
  },
  {
    path: '/usuarios',
    titulo: 'Usuarios Administrativos',
    descripcion: 'Crear nuevos usuarios administrativos y gestionar roles/permisos.',
    Icon: ShieldCheck,
    rol: 'SuperAdmin',
  },
  {
    path: '/dashboard',
    titulo: 'Reservas',
    descripcion: 'Crear, modificar, eliminar o consultar reservas.',
    Icon: Calendar,
    rol: null,
  },
  {
    path: '/dashboard',
    titulo: 'Disciplinas',
    descripcion: 'Crear, modificar, eliminar o consultar disciplinas.',
    Icon: Trophy,
    rol: null,
  },
];


function DashboardPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const secciones = SECCIONES.filter(s => !s.rol || s.rol === role);

  return (
    <div className="dashboard-main">
      <h1 className="dashboard-title">Panel principal</h1>
      <p className="dashboard-subtitle">Bienvenido, <strong>{user?.email}</strong>. Accedé rápidamente a las secciones del sistema.</p>

      <div className="dashboard-grid">
        {secciones.map(s => {
          const Icon = s.Icon;
          return (
            <button
              key={s.titulo}
              className="dashboard-card"
              onClick={() => navigate(s.path)}
            >
              <div className="dashboard-card-top">
                <span className="dashboard-card-icon"><Icon size={20} aria-hidden="true" /></span>
                <span className="dashboard-card-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span>
              </div>
              <span className="dashboard-card-titulo">{s.titulo}</span>
              <span className="dashboard-card-descripcion">{s.descripcion}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default DashboardPage;
