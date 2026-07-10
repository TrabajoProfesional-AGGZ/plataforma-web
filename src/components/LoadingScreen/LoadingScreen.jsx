import logo from '../../assets/logo_socio.png';
import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <output className="loading-screen" aria-label="Cargando">
      <img src={logo} alt="SocioUnido" className="loading-logo" />
    </output>
  );
}

export default LoadingScreen;
