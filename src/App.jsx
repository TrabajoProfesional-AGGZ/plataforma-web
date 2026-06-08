import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import SociosPage from './pages/SociosPage/SociosPage';
import CambiarContrasenaPage from './pages/CambiarContrasenaPage/CambiarContrasenaPage';
import UsuariosPage from './pages/UsuariosPage/UsuariosPage';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import AppLayout from './components/AppLayout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/socios" element={<SociosPage />} />
            <Route path="/cambiar-contrasena" element={<CambiarContrasenaPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredRole="superAdmin" />}>
          <Route element={<AppLayout />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
