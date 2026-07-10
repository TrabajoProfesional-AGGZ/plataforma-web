import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({ onAuthStateChanged: jest.fn() }));

jest.mock('./hooks/useAuth');
import { useAuth } from './hooks/useAuth';

jest.mock('./components/AppLayout/AppLayout', () => {
  const { Outlet } = require('react-router-dom');
  return function MockAppLayout() {
    return <Outlet />;
  };
});

jest.mock('./pages/LoginPage/LoginPage', () => () => <div>Login Page</div>);
jest.mock('./pages/DashboardPage/DashboardPage', () => () => <div>Dashboard Page</div>);
jest.mock('./pages/PerfilPage/PerfilPage', () => () => <div>Perfil Page</div>);
jest.mock('./pages/CambiarContrasenaPage/CambiarContrasenaPage', () => () => <div>Cambiar Contraseña Page</div>);
jest.mock('./pages/SociosPage/SociosPage', () => () => <div>Socios Page</div>);
jest.mock('./pages/UsuariosPage/UsuariosPage', () => () => <div>Usuarios Page</div>);
jest.mock('./pages/InstalacionesPage/InstalacionesPage', () => () => <div>Instalaciones Page</div>);
jest.mock('./pages/DisciplinasPage/DisciplinasPage', () => () => <div>Disciplinas Page</div>);
jest.mock('./pages/NoticiasPage/NoticiasPage', () => () => <div>Noticias Page</div>);
jest.mock('./pages/AlertasPage/AlertasPage', () => () => <div>Alertas Page</div>);
jest.mock('./pages/MetricasPage/MetricasPage', () => () => <div>Métricas Page</div>);

function renderAt(path, permisos = []) {
  useAuth.mockReturnValue({ user: { uid: '1' }, loading: false, permisos });
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('App - mapeo ruta -> permiso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sin permiso ver_instalaciones, /instalaciones redirige a /dashboard', () => {
    renderAt('/instalaciones', []);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Instalaciones Page')).not.toBeInTheDocument();
  });

  test('con permiso ver_instalaciones, /instalaciones renderiza la página', () => {
    renderAt('/instalaciones', ['ver_instalaciones']);
    expect(screen.getByText('Instalaciones Page')).toBeInTheDocument();
  });

  test('sin permiso ver_disciplinas, /disciplinas redirige a /dashboard', () => {
    renderAt('/disciplinas', []);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Disciplinas Page')).not.toBeInTheDocument();
  });

  test('con permiso ver_disciplinas, /disciplinas renderiza la página', () => {
    renderAt('/disciplinas', ['ver_disciplinas']);
    expect(screen.getByText('Disciplinas Page')).toBeInTheDocument();
  });

  test('/dashboard, /perfil y /cambiar-contrasena no requieren permiso', () => {
    renderAt('/perfil', []);
    expect(screen.getByText('Perfil Page')).toBeInTheDocument();
  });

  test('/socios sigue gateado por ver_socios', () => {
    renderAt('/socios', []);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    renderAt('/socios', ['ver_socios']);
    expect(screen.getByText('Socios Page')).toBeInTheDocument();
  });
});
