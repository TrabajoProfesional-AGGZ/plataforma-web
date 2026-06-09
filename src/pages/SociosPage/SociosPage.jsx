import { useState } from 'react';
import { getSocios, getSocioPorDni } from '../../services/sociosService';
import logo from '../../assets/logo_socio.png';
import logoVerde from '../../assets/logo-verde.png';
import logoRojo from '../../assets/logo-rojo.png';
import logoAmarillo from '../../assets/logo-amarillo.png';
import './SociosPage.css';

const ESTADO_CONFIG = {
  'Al día': { logo: logoVerde,    bg: '#8ac98ab0', border: '#0D6E0D' },
  'Moroso': { logo: logoRojo,     bg: '#f0b2b2d2', border: '#A01414' },
};
const ESTADO_DEFAULT = { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' };

function estadoConfig(estado) {
  return ESTADO_CONFIG[estado] ?? ESTADO_DEFAULT;
}

function SociosPage() {
  const [dni, setDni] = useState('');
  const [modo, setModo] = useState('idle'); // idle | socio | lista | no-encontrado
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleBuscar(e) {
    e.preventDefault();
    if (!dni.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const socio = await getSocioPorDni(dni.trim());
      setResultado(socio);
      setModo('socio');
    } catch (err) {
      if (err.message === 'no-encontrado') {
        setModo('no-encontrado');
        setResultado(null);
      } else if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setError('Error al buscar el socio. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerTodos() {
    setLoading(true);
    setError(null);
    setDni('');
    try {
      const socios = await getSocios();
      setResultado(socios);
      setModo('lista');
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setError('Error al obtener los socios. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="socios-page">
      <h1 className="socios-title">Socios</h1>

      <div className="socios-toolbar">
        <form className="socios-search-form" onSubmit={handleBuscar}>
          <input
            className="socios-search-input"
            type="text"
            placeholder="Buscar por DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
          />
          <button
            className="socios-search-button"
            type="submit"
            disabled={loading || !dni.trim()}
          >
            Buscar
          </button>
        </form>
        <button
          className="socios-ver-todos-button"
          onClick={handleVerTodos}
          disabled={loading}
        >
          Ver todos
        </button>
      </div>

      {loading && (
        <div className="socios-search-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      )}
      {error && <p className="socios-error">{error}</p>}

      {!loading && modo === 'no-encontrado' && (
        <p className="socios-no-encontrado">No se encontró ningún socio con ese DNI.</p>
      )}

      {!loading && modo === 'socio' && resultado && (() => {
        const cfg = estadoConfig(resultado.estado);
        return (
          <div
            className="socios-card"
            style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
          >
            <img src={cfg.logo} alt="" className="socios-card-logo" />
            <div className="socios-card-data">
              <div className="socios-card-row">
                <span className="socios-card-label">N° Socio</span>
                <span>{resultado.id_socio}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Nombre</span>
                <span>{resultado.nombre} {resultado.apellido}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Categoría</span>
                <span>{resultado.categoria}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Estado</span>
                <span>{resultado.estado}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {!loading && modo === 'lista' && Array.isArray(resultado) && (
        resultado.length === 0 ? (
          <p className="socios-no-encontrado">No hay socios registrados.</p>
        ) : (
          <table className="socios-table">
            <thead>
              <tr>
                <th>N° Socio</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((s) => {
                const cfg = estadoConfig(s.estado);
                return (
                  <tr key={s.id_socio}>
                    <td>{s.id_socio}</td>
                    <td>{s.nombre} {s.apellido}</td>
                    <td>{s.categoria}</td>
                    <td>
                      <span
                        className="socios-estado-cell"
                        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                      >
                        <img src={cfg.logo} alt="" className="socios-estado-logo" />
                        {s.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default SociosPage;
