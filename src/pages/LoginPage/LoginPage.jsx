import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { login } from '../../services/authService';
import { RecuperarContraseniaModal } from './RecuperarContraseniaModal';
import { useTheme } from '../../hooks/useTheme';
import './LoginPage.css';
import '../../styles/shared.css';

const formContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.85 } },
  exiting: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const formItemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exiting: { x: -20, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

const CODIGOS_CREDENCIALES_INVALIDAS = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
];

/** Solo credenciales inválidas conocidas dan un mensaje específico; cualquier otro error se trata como servicio caído. */
function resolverMensajeErrorLogin(err) {
  if (err.message === 'unauthorized' || CODIGOS_CREDENCIALES_INVALIDAS.includes(err.code)) {
    return 'Credenciales incorrectas';
  }
  return 'Servicio no disponible';
}

/** Pantalla de login con animación de entrada/salida y recuperación de contraseña. */
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [logoFadingOut, setLogoFadingOut] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [animStarted, setAnimStarted] = useState(false);
  const { logoSocioAlt, logoConTexto } = useTheme();
  const navigate = useNavigate();
  const navigated = useRef(false);
  const location = useLocation();
  const passwordChanged = location.state?.passwordChanged ?? false;

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setTimeout(() => setAnimStarted(true), 300);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  /** Evita navegar dos veces si la animación de salida dispara el callback más de una vez. */
  function safeNavigate() {
    if (!navigated.current) {
      navigated.current = true;
      navigate('/dashboard');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (shouldReduceMotion) {
        safeNavigate();
      } else {
        setExiting(true);
        setTimeout(safeNavigate, 2000);
      }
    } catch (err) {
      setError(resolverMensajeErrorLogin(err));
      setLoading(false);
    }
  }

  return (
    <div className="login-split">
      {!shouldReduceMotion && (
        <motion.div
          className="login-intro-overlay"
          initial={{ width: '100%' }}
          animate={{ width: animStarted ? '50%' : '100%' }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <img src={logoSocioAlt} alt="" className="login-intro-logo" />
        </motion.div>
      )}
      {!shouldReduceMotion && exiting && (
        <motion.div
          className="login-exit-overlay"
          initial={{ width: '50%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={() => setLogoFadingOut(true)}
          aria-hidden="true"
        >
          <motion.img
            src={logoConTexto}
            alt=""
            className="login-exit-logo"
            initial={{ x: 60, opacity: 0 }}
            animate={logoFadingOut ? { x: 0, opacity: 0 } : { x: 0, opacity: 1 }}
            transition={logoFadingOut
              ? { duration: 0.5, delay: 0.3 }
              : { delay: 0.25, duration: 0.45, ease: 'easeOut' }
            }
            onAnimationComplete={logoFadingOut ? safeNavigate : undefined}
          />
        </motion.div>
      )}

      <div className="login-panel-left">
        <img src={logoSocioAlt} alt="SocioUnido" className="login-logo-left" />
      </div>

      <div className="login-panel-right">
        <motion.div
          className="login-right-content"
          variants={formContainerVariants}
          initial="hidden"
          animate={exiting ? 'exiting' : 'visible'}
        >
          <motion.p className="login-tagline" variants={formItemVariants}>
            Porque el club es de los socios, y la gestión es de <strong>SocioUnido</strong>
          </motion.p>
          <motion.form onSubmit={handleSubmit} className="login-form" variants={formItemVariants}>
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
            <div className="login-forgot-wrapper">
              <button
                type="button"
                className="login-forgot-btn"
                onClick={() => setMostrarRecuperar(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
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
          </motion.form>
        </motion.div>
      </div>

      {mostrarRecuperar && (
        <RecuperarContraseniaModal onClose={() => setMostrarRecuperar(false)} />
      )}
    </div>
  );
}

export default LoginPage;
