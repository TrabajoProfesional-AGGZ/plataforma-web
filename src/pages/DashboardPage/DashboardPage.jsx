import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './DashboardPage.css';

const SECCIONES = [
  {
    path: '/socios',
    titulo: 'Socios',
    descripcion: 'Crear nuevos usuarios y consultar el padrón de socios.',
    rol: null,
  },
  {
    path: '/usuarios',
    titulo: 'Usuarios Administrativos',
    descripcion: 'Crear nuevos usuarios administrativos y gestionar roles/permisos.',
    rol: 'superAdmin',
  },
  {
    path: '/dashboard',
    titulo: 'Reservas',
    descripcion: 'Crear, modificar, eliminar o consultar reservas',
    rol: null,
  },
  {
    path: '/dashboard',
    titulo: 'Disciplinas',
    descripcion: 'Crear, modificar, eliminar o consultar disciplinas',
  }
];

function DashboardPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const secciones = SECCIONES.filter(s => !s.rol || s.rol === role);

  return (
    <div className="dashboard-main">
      <h1 className="dashboard-title">Panel principal</h1>
      <div className="dashboard-grid">
        {secciones.map(s => (
          <button
            key={s.titulo}
            className="dashboard-card"
            onClick={() => navigate(s.path)}
          >
            <span className="dashboard-card-titulo">{s.titulo}</span>
            <span className="dashboard-card-descripcion">{s.descripcion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
