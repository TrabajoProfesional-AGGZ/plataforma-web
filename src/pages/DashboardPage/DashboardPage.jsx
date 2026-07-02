import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, ShieldCheck, ArrowUpRight, Building2, Trophy, Newspaper, Bell } from 'lucide-react';
import './DashboardPage.css';

const SECCIONES = [
  {
    path: '/socios',
    titulo: 'Socios',
    descripcion: 'Crear nuevos socios y consultar el padrón.',
    Icon: Users,
    permiso: 'ver_socios',
  },
  {
    path: '/usuarios',
    titulo: 'Usuarios Administrativos',
    descripcion: 'Crear nuevos usuarios administrativos y gestionar roles/permisos.',
    Icon: ShieldCheck,
    permiso: 'ver_usuarios',
  },
  {
    path: '/instalaciones',
    titulo: 'Reservas e Instalaciones',
    descripcion: 'Administrar espacios físicos y reservas.',
    Icon: Building2,
    permiso: 'ver_instalaciones',
  },
  {
    path: '/disciplinas',
    titulo: 'Disciplinas',
    descripcion: 'Crear, modificar, eliminar o consultar disciplinas.',
    Icon: Trophy,
    permiso: 'ver_disciplinas',
  },
  {
    path: '/noticias',
    titulo: 'Noticias',
    descripcion: 'Publicar noticias',
    Icon: Newspaper,
    permiso: 'ver_noticias',
  },
  {
    path: '/alertas',
    titulo: 'Alertas',
    descripcion: 'Crear alertas para los socios',
    Icon: Bell,
    permiso: 'ver_alertas',
  }
];


function DashboardPage() {
  const navigate = useNavigate();
  const { user, permisos } = useAuth();

  const secciones = SECCIONES.filter(s => !s.permiso || permisos.includes(s.permiso));

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
