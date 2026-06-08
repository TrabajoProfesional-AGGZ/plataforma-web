import logo from '../../assets/logo_socio.png';
import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src={logo} alt="SocioUnido" className="loading-logo" />
    </div>
  );
}

export default LoadingScreen;
