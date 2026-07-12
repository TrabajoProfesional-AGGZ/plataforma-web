import { useTheme } from '../../hooks/useTheme';
import './LoadingScreen.css';

function LoadingScreen() {
  const { logoSocio: logo } = useTheme();
  return (
    <output className="loading-screen" aria-label="Cargando">
      <img src={logo} alt="SocioUnido" className="loading-logo" />
    </output>
  );
}

export default LoadingScreen;
