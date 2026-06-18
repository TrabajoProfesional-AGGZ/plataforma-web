import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../services/authService';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import logoConTexto from '../../assets/logo_con_texto.png';
import './LoginPage.css';
import '../../styles/shared.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const passwordChanged = location.state?.passwordChanged ?? false;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setRedirecting(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch {
      setError('Credenciales incorrectas');
      setLoading(false);
    }
  }

  if (redirecting) {
    return <LoadingScreen />;
  }

  return (
    <div className="login-container">
      <img src={logoConTexto} alt="SocioUnido" className="login-logo" />
      <p className="login-tagline">Porque el club es de los socios, y la gestión es de <strong>SocioUnido</strong></p>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Contraseña</label>
          <div className="login-password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        {passwordChanged && (
          <p className="login-success" role="status">
            Contraseña actualizada correctamente
          </p>
        )}
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
