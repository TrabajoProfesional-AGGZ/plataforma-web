import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import texto from '../../assets/texto.png';
import './DashboardPage.css';

function DashboardPage() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <img src={texto} alt="SocioUnido" className="dashboard-logo" />
        <button className="dashboard-logout-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>
      <main className="dashboard-main">
      </main>
    </div>
  );
}

export default DashboardPage;
