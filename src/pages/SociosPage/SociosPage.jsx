import { useState, useEffect } from 'react';
import { getSocios, deleteSocio } from '../../services/sociosService';
import { CreateSocioForm } from '../../components/createForm/CreateSocioForm';
import { EditSocioForm } from '../../components/editForm/EditSocioForm';
import logo from '../../assets/logo_socio.png';
import logoVerde from '../../assets/logo-verde.png';
import logoRojo from '../../assets/logo-rojo.png';
import logoAmarillo from '../../assets/logo-amarillo.png';
import logoNaranja from '../../assets/logo-naranja.png'
import './SociosPage.css';

const ESTADO_CONFIG = {
  'Activo': { logo: logoVerde,    bg: '#8ac98ab0', border: '#0D6E0D' },
  'Moroso': { logo: logoRojo,     bg: '#f0b2b2d2', border: '#A01414' },
  'Inactivo': {logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' },
  'Suspendido': {logo: logoNaranja, bg: '#ffbd98', border: '#f14701'}
};
const ESTADO_DEFAULT = { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' };

function estadoConfig(estado) {
  return ESTADO_CONFIG[estado] ?? ESTADO_DEFAULT;
}

function getValorOrden(socio, campo) {
  const val = socio[campo];
  if (val && typeof val === 'object') return String(val.nombre ?? '').toLowerCase();
  return String(val ?? '').toLowerCase();
}

const ICONOS_ORDEN = { asc: ' ↑', desc: ' ↓', none: ' ↕' };


function SociosPage() {
  const [nroSocio, setNroSocio] = useState('');
  const [modo, setModo] = useState('idle'); // idle | socio | lista | no-encontrado
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orden, setOrden] = useState({ campo: null, dir: 'asc' });

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAbierto, setFiltroAbierto] = useState(false);

  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    handleVerTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyModalOpen = crearModalOpen || editarModalOpen || eliminarModalOpen;
  useEffect(() => {
    if (!anyModalOpen) return;
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (crearModalOpen) setCrearModalOpen(false);
      else if (editarModalOpen) setEditarModalOpen(false);
      else if (eliminarModalOpen) setEliminarModalOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen, crearModalOpen, editarModalOpen, eliminarModalOpen]);

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
      const va = getValorOrden(a, orden.campo);
      const vb = getValorOrden(b, orden.campo);
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
    setFiltroEstado('');
    setFiltroAbierto(false);
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

  function abrirEditar() {
    setErrorModal('');
    setEditarModalOpen(true);
  }

  function abrirEliminar() {
    setErrorModal('');
    setEliminarModalOpen(true);
  }

  async function handleEliminar() {
    setGuardando(true);
    setErrorModal('');
    try {
      await deleteSocio(resultado.id);
      setEliminarModalOpen(false);
      setModo('idle');
      setResultado(null);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorModal('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setErrorModal('Error al eliminar el socio. Intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
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
        <button className="socios-ver-todos-button" onClick={handleVerTodos} disabled={loading}>
          Ver todos
        </button>
        <button className="socios-crear-button" onClick={() => setCrearModalOpen(true)} disabled={loading}>
          Crear socio
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
          <div className="socios-card" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
            <div className="socios-card-inner">
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
            <div className="socios-card-actions">
              <button className="socios-btn-eliminar" onClick={abrirEliminar}>
                Eliminar
              </button>
              <button className="socios-btn-editar" onClick={abrirEditar}>
                Editar
              </button>
            </div>
          </div>
        );
      })()}

      {!loading && modo === 'lista' && Array.isArray(resultado) && (
        resultado.length === 0 ? (
          <p className="socios-no-encontrado">No hay socios registrados.</p>
        ) : (() => {
          const estadosUnicos = [...new Set(resultado.map(s => s.estado.nombre))].sort();
          const listaFiltrada = filtroEstado
            ? resultado.filter(s => s.estado.nombre === filtroEstado)
            : resultado;
          return (
          <>
            <div className="socios-filtros">
              <button
                className="socios-filtro-toggle"
                type="button"
                onClick={() => setFiltroAbierto(p => !p)}
              >
                Filtrar por
              </button>
              {filtroAbierto && (
                <div className="socios-filtro-estado-wrapper">
                  <select
                    id="filtro-estado"
                    className="socios-filtro-select"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {estadosUnicos.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {listaFiltrada.length === 0 ? (
              <p className="socios-no-encontrado">No hay socios con ese estado.</p>
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
              {aplicarOrden(listaFiltrada).map((s) => {
                const cfg = estadoConfig(s.estado.nombre);
                return (
                  <tr
                    key={s.id}
                    className="socios-tr-clickable"
                    onClick={() => { setResultado(s); setModo('socio'); }}
                  >
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
            )}
          </>
          );
        })()
      )}

      {/* Modal crear socio */}
      {crearModalOpen && (
        <CreateSocioForm
          onSuccess={() => { setCrearModalOpen(false); handleVerTodos(); }}
          onCancel={() => setCrearModalOpen(false)}
        />
      )}

      {/* Modal editar socio */}
      {editarModalOpen && resultado && (
        <EditSocioForm
          socio={resultado}
          onSuccess={(socioActualizado) => { setResultado(socioActualizado); setEditarModalOpen(false); }}
          onCancel={() => setEditarModalOpen(false)}
        />
      )}

      {/* Modal confirmar eliminación */}
      {eliminarModalOpen && resultado && (
        <div className="modal-overlay" onClick={() => setEliminarModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar socio</h2>
            <p className="modal-confirmar-texto">
              ¿Estás seguro de que querés eliminar al socio N°&nbsp;{resultado.nro_socio}?
            </p>
            {errorModal && <p className="modal-error" role="alert">{errorModal}</p>}
            <div className="modal-actions">
              <button type="button" className="modal-button-cancel" onClick={() => setEliminarModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="modal-button-danger" onClick={handleEliminar} disabled={guardando}>
                {guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SociosPage;
