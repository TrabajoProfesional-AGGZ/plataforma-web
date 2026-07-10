import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import SociosPage from './pages/SociosPage/SociosPage';
import CambiarContrasenaPage from './pages/CambiarContrasenaPage/CambiarContrasenaPage';
import PerfilPage from './pages/PerfilPage/PerfilPage';
import UsuariosPage from './pages/UsuariosPage/UsuariosPage';
import InstalacionesPage from './pages/InstalacionesPage/InstalacionesPage';
import DisciplinasPage from './pages/DisciplinasPage/DisciplinasPage';
import NoticiasPage from './pages/NoticiasPage/NoticiasPage';
import AlertasPage from './pages/AlertasPage/AlertasPage';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import AppLayout from './components/AppLayout/AppLayout';
import MetricasPage from './pages/MetricasPage/MetricasPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/cambiar-contrasena" element={<CambiarContrasenaPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredPermiso="ver_socios" />}>
          <Route element={<AppLayout />}>
            <Route path="/socios" element={<SociosPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredPermiso="ver_instalaciones" />}>
          <Route element={<AppLayout />}>
            <Route path="/instalaciones" element={<InstalacionesPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredPermiso="ver_disciplinas" />}>
          <Route element={<AppLayout />}>
            <Route path="/disciplinas" element={<DisciplinasPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredPermiso="ver_usuarios" />}>
          <Route element={<AppLayout />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredPermiso="ver_noticias" />}>
          <Route element={<AppLayout />}>
            <Route path="/noticias" element={<NoticiasPage />} />
          </Route>
        </Route>
        <Route element={<PrivateRoute requiredPermiso="ver_metricas" />}>
          <Route element={<AppLayout />}>
            <Route path="/metricas" element={<MetricasPage />} />
          </Route>
        </Route>
        <Route element={<PrivateRoute requiredPermiso="ver_alertas" />}>
          <Route element={<AppLayout />}>
            <Route path="/alertas" element={<AlertasPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
