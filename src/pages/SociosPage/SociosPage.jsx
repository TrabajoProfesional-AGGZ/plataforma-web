import { useState } from 'react';
import { getSocios } from '../../services/sociosService';
import logo from '../../assets/logo_socio.png';
import logoVerde from '../../assets/logo-verde.png';
import logoRojo from '../../assets/logo-rojo.png';
import logoAmarillo from '../../assets/logo-amarillo.png';
import './SociosPage.css';

const ESTADO_CONFIG = {
  'Activo': { logo: logoVerde,    bg: '#8ac98ab0', border: '#0D6E0D' },
  'Moroso': { logo: logoRojo,     bg: '#f0b2b2d2', border: '#A01414' },
};
const ESTADO_DEFAULT = { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' };

function estadoConfig(estado) {
  return ESTADO_CONFIG[estado] ?? ESTADO_DEFAULT;
}

const ICONOS_ORDEN = { asc: ' ↑', desc: ' ↓', none: ' ↕' };

function SociosPage() {
  const [nroSocio, setNroSocio] = useState('');
  const [modo, setModo] = useState('idle'); // idle | socio | lista | no-encontrado
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orden, setOrden] = useState({ campo: null, dir: 'asc' });

  function toggleOrden(campo) {
    setOrden(prev => {
      if (prev.campo !== campo) return { campo, dir: 'asc' };
      if (prev.dir === 'asc') return { campo, dir: 'desc' };
      return { campo: null, dir: 'asc' };
    });
  }

  function iconoOrden(campo) {
    if (orden.campo !== campo) return ICONOS_ORDEN.none;
    return ICONOS_ORDEN[orden.dir];
  }

  function aplicarOrden(socios) {
    if (!orden.campo) return socios;
    return [...socios].sort((a, b) => {
      const va = String(a[orden.campo] ?? '').toLowerCase();
      const vb = String(b[orden.campo] ?? '').toLowerCase();
      if (va < vb) return orden.dir === 'asc' ? -1 : 1;
      if (va > vb) return orden.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  async function handleBuscar(e) {
    e.preventDefault();
    if (!nroSocio.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const socios = await getSocios();
      const encontrado = socios.find(s => s.nro_socio === nroSocio.trim());
      if (encontrado) {
        setResultado(encontrado);
        setModo('socio');
      } else {
        setModo('no-encontrado');
        setResultado(null);
      }
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
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
    setNroSocio('');
    setOrden({ campo: null, dir: 'asc' });
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
      <h1 className="socios-title">Consultar Socios</h1>
      <div className="socios-toolbar">
        <form className="socios-search-form" onSubmit={handleBuscar}>
          <input
            className="socios-search-input"
            type="text"
            placeholder="Buscar por N° de socio"
            value={nroSocio}
            onChange={(e) => setNroSocio(e.target.value)}
          />
          <button
            className="socios-search-button"
            type="submit"
            disabled={loading || !nroSocio.trim()}
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
        <p className="socios-no-encontrado">No se encontró ningún socio con ese N° de socio.</p>
      )}

      {!loading && modo === 'socio' && resultado && (() => {
        const cfg = estadoConfig(resultado.estado.nombre);
        return (
          <div
            className="socios-card"
            style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
          >
            <img src={cfg.logo} alt="" className="socios-card-logo" />
            <div className="socios-card-data">
              <div className="socios-card-row">
                <span className="socios-card-label">N° Socio</span>
                <span>{resultado.nro_socio}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Apellido y nombre</span>
                <span>{resultado.apellido} {resultado.nombre}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">DNI</span>
                <span>{resultado.nro_documento}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Fecha de nacimiento</span>
                <span>{resultado.fecha_nacimiento}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Email</span>
                <span>{resultado.email}</span>
              </div>
              {resultado.telefono && (
                <div className="socios-card-row">
                  <span className="socios-card-label">Teléfono</span>
                  <span>{resultado.telefono}</span>
                </div>
              )}
              <div className="socios-card-row">
                <span className="socios-card-label">Categoría</span>
                <span>{resultado.categoria.nombre}</span>
              </div>
              <div className="socios-card-row">
                <span className="socios-card-label">Estado</span>
                <span>{resultado.estado.nombre}</span>
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
                <th className="socios-th-sort" onClick={() => toggleOrden('nro_socio')}>
                  N° Socio{iconoOrden('nro_socio')}
                </th>
                <th className="socios-th-sort" onClick={() => toggleOrden('apellido')}>
                  Apellido{iconoOrden('apellido')}
                </th>
                <th className="socios-th-sort" onClick={() => toggleOrden('nombre')}>
                  Nombre{iconoOrden('nombre')}
                </th>
                <th className="socios-th-sort" onClick={() => toggleOrden('categoria')}>
                  Categoría{iconoOrden('categoria')}
                </th>
                <th className="socios-th-sort" onClick={() => toggleOrden('estado')}>
                  Estado{iconoOrden('estado')}
                </th>
              </tr>
            </thead>
            <tbody>
              {aplicarOrden(resultado).map((s) => {
                const cfg = estadoConfig(s.estado.nombre);
                return (
                  <tr key={s.id}>
                    <td>{s.nro_socio}</td>
                    <td>{s.apellido}</td>
                    <td>{s.nombre}</td>
                    <td>{s.categoria.nombre}</td>
                    <td>
                      <span
                        className="socios-estado-cell"
                        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                      >
                        <img src={cfg.logo} alt="" className="socios-estado-logo" />
                        {s.estado.nombre}
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
