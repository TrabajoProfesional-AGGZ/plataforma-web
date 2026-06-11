import { useState, useEffect } from 'react';
import { fetchUsuarios, eliminarUsuario, cambiarRolUsuario } from '../../services/usuariosService';
import { fetchRoles } from '../../services/rolesService';
import { CreateUserForm } from '../../components/createUserForm/CreateUserForm';
import { EditUserForm } from '../../components/editUserForm/EditUserForm';
import logo from '../../assets/logo_socio.png';
import logoVerde from '../../assets/logo-verde.png';
import logoAmarillo from '../../assets/logo-amarillo.png';
import './UsuariosPage.css';

const ESTADO_CONFIG = {
  'Activo':   { logo: logoVerde,    bg: '#8ac98ab0', border: '#0D6E0D' },
  'Inactivo': { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' },
};
const ESTADO_DEFAULT = { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' };

function estadoConfig(nombre) {
  return ESTADO_CONFIG[nombre] ?? ESTADO_DEFAULT;
}

const ICONOS_ORDEN = { asc: ' ↑', desc: ' ↓', none: ' ↕' };

function getValorOrden(usuario, campo) {
  if (campo === 'rol') return String(usuario.rol?.nombre ?? '').toLowerCase();
  if (campo === 'estado') return String(usuario.estado?.nombre ?? '').toLowerCase();
  return String(usuario[campo] ?? '').toLowerCase();
}

function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [modo, setModo] = useState('lista');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orden, setOrden] = useState({ campo: null, dir: 'asc' });

  const [filtroRol, setFiltroRol] = useState('');
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const [roles, setRoles] = useState([]);

  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [cambiarRolModalOpen, setCambiarRolModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [nuevoRol, setNuevoRol] = useState('');

  useEffect(() => {
    cargarUsuarios();
    fetchRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyModalOpen = crearModalOpen || editarModalOpen || eliminarModalOpen || cambiarRolModalOpen;
  useEffect(() => {
    if (!anyModalOpen) return;
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (crearModalOpen) setCrearModalOpen(false);
      else if (editarModalOpen) setEditarModalOpen(false);
      else if (eliminarModalOpen) setEliminarModalOpen(false);
      else if (cambiarRolModalOpen) setCambiarRolModalOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen, crearModalOpen, editarModalOpen, eliminarModalOpen, cambiarRolModalOpen]);

  async function cargarUsuarios() {
    setLoading(true);
    setError(null);
    setBusqueda('');
    setFiltroBusqueda('');
    setFiltroRol('');
    setFiltroAbierto(false);
    setOrden({ campo: null, dir: 'asc' });
    try {
      const usuarios = await fetchUsuarios();
      setResultado(usuarios);
      setModo('lista');
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setError('Error al obtener los usuarios. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleBuscar(e) {
    e.preventDefault();
    setFiltroBusqueda(busqueda.trim().toLowerCase());
    setModo('lista');
  }

  function handleVerTodos() {
    cargarUsuarios();
  }

  function toggleOrden(campo) {
    setOrden((prev) => {
      if (prev.campo !== campo) return { campo, dir: 'asc' };
      if (prev.dir === 'asc') return { campo, dir: 'desc' };
      return { campo: null, dir: 'asc' };
    });
  }

  function iconoOrden(campo) {
    if (orden.campo !== campo) return ICONOS_ORDEN.none;
    return ICONOS_ORDEN[orden.dir];
  }

  function aplicarOrden(lista) {
    if (!orden.campo) return lista;
    return [...lista].sort((a, b) => {
      const va = getValorOrden(a, orden.campo);
      const vb = getValorOrden(b, orden.campo);
      if (va < vb) return orden.dir === 'asc' ? -1 : 1;
      if (va > vb) return orden.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function abrirEditar() {
    setErrorModal('');
    setEditarModalOpen(true);
  }

  function abrirEliminar() {
    setErrorModal('');
    setEliminarModalOpen(true);
  }

  function abrirCambiarRol() {
    setErrorModal('');
    setNuevoRol(resultado?.rol?.nombre ?? '');
    setCambiarRolModalOpen(true);
  }

  async function handleEliminar() {
    setGuardando(true);
    setErrorModal('');
    try {
      await eliminarUsuario(resultado.id);
      setEliminarModalOpen(false);
      setModo('lista');
      cargarUsuarios();
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorModal('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setErrorModal('Error al eliminar el usuario. Intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleCambiarRol() {
    if (!nuevoRol || nuevoRol === resultado?.rol?.nombre) {
      setCambiarRolModalOpen(false);
      return;
    }
    setGuardando(true);
    setErrorModal('');
    try {
      const actualizado = await cambiarRolUsuario(resultado.id, nuevoRol);
      setResultado(actualizado);
      setCambiarRolModalOpen(false);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorModal('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setErrorModal('Error al cambiar el rol. Intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  const listaBase = Array.isArray(resultado) ? resultado : [];

  const listaFiltrada = listaBase.filter((u) => {
    const matchRol = filtroRol ? u.rol?.nombre === filtroRol : true;
    const matchBusqueda = filtroBusqueda
      ? `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(filtroBusqueda)
      : true;
    return matchRol && matchBusqueda;
  });

  const rolesUnicos = [...new Set(listaBase.map((u) => u.rol?.nombre).filter(Boolean))].sort();

  return (
    <div className="usuarios-page">
      <h1 className="usuarios-title">Consultar Usuarios</h1>

      <div className="usuarios-toolbar">
        <form className="usuarios-search-form" onSubmit={handleBuscar}>
          <input
            className="usuarios-search-input"
            type="text"
            placeholder="Buscar por nombre, apellido o email"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            className="usuarios-search-button"
            type="submit"
            disabled={loading || !busqueda.trim()}
          >
            Buscar
          </button>
        </form>
        <button className="usuarios-ver-todos-button" onClick={handleVerTodos} disabled={loading}>
          Ver todos
        </button>
        <button className="usuarios-crear-button" onClick={() => setCrearModalOpen(true)} disabled={loading}>
          Crear usuario
        </button>
      </div>

      {loading && (
        <div className="usuarios-search-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      )}
      {error && <p className="usuarios-error">{error}</p>}

      {!loading && modo === 'lista' && (
        <>
          <div className="usuarios-filtros">
            <button
              className="usuarios-filtro-toggle"
              type="button"
              onClick={() => setFiltroAbierto((p) => !p)}
            >
              Filtrar por
            </button>
            {filtroAbierto && (
              <div className="usuarios-filtros-dropdowns">
                <div className="usuarios-filtros-grupo">
                  <select
                    className="usuarios-filtro-select"
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                  >
                    <option value="">Rol: Todos</option>
                    {rolesUnicos.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {listaBase.length === 0 ? (
            <p className="usuarios-no-encontrado">No hay usuarios registrados.</p>
          ) : listaFiltrada.length === 0 ? (
            <p className="usuarios-no-encontrado">No hay usuarios con los filtros seleccionados.</p>
          ) : (
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th className="usuarios-th-sort" onClick={() => toggleOrden('apellido')}>
                    Apellido{iconoOrden('apellido')}
                  </th>
                  <th className="usuarios-th-sort" onClick={() => toggleOrden('nombre')}>
                    Nombre{iconoOrden('nombre')}
                  </th>
                  <th className="usuarios-th-sort" onClick={() => toggleOrden('email')}>
                    Email{iconoOrden('email')}
                  </th>
                  <th className="usuarios-th-sort" onClick={() => toggleOrden('rol')}>
                    Rol{iconoOrden('rol')}
                  </th>
                  <th className="usuarios-th-sort" onClick={() => toggleOrden('estado')}>
                    Estado{iconoOrden('estado')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {aplicarOrden(listaFiltrada).map((u) => {
                  const cfg = estadoConfig(u.estado?.nombre);
                  return (
                    <tr
                      key={u.id}
                      className="usuarios-tr-clickable"
                      onClick={() => { setResultado(u); setModo('usuario'); }}
                    >
                      <td>{u.apellido}</td>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="usuarios-rol-badge">{u.rol?.nombre}</span>
                      </td>
                      <td>
                        <span
                          className="usuarios-estado-cell"
                          style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                        >
                          <img src={cfg.logo} alt="" className="usuarios-estado-logo" />
                          {u.estado?.nombre}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {!loading && modo === 'usuario' && resultado && !Array.isArray(resultado) && (() => {
        const cfg = estadoConfig(resultado.estado?.nombre);
        const permisos = resultado.rol?.permisos ?? [];
        return (
          <div className="usuarios-card" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
            <div className="usuarios-card-inner">
              <img src={cfg.logo} alt="" className="usuarios-card-logo" />
              <div className="usuarios-card-data">
                <div className="usuarios-card-row">
                  <span className="usuarios-card-label">Apellido y nombre</span>
                  <span>{resultado.apellido} {resultado.nombre}</span>
                </div>
                <div className="usuarios-card-row">
                  <span className="usuarios-card-label">Email</span>
                  <span>{resultado.email}</span>
                </div>
                <div className="usuarios-card-row">
                  <span className="usuarios-card-label">Fecha de nacimiento</span>
                  <span>{resultado.fecha_nacimiento}</span>
                </div>
                <div className="usuarios-card-row">
                  <span className="usuarios-card-label">Rol</span>
                  <span>{resultado.rol?.nombre}</span>
                </div>
                <div className="usuarios-card-row">
                  <span className="usuarios-card-label">Estado</span>
                  <span>{resultado.estado?.nombre}</span>
                </div>
                {permisos.length > 0 && (
                  <div className="usuarios-card-permisos">
                    <span className="usuarios-card-label">Permisos</span>
                    <div className="usuarios-permisos-lista">
                      {permisos.map((p) => (
                        <span key={p.id} className="usuarios-permiso-tag">{p.nombre}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="usuarios-card-actions">
              <button className="usuarios-btn-eliminar" onClick={abrirEliminar}>
                Eliminar
              </button>
              <div className="usuarios-card-actions-right">
                <button className="usuarios-btn-cambiar-rol" onClick={abrirCambiarRol}>
                  Cambiar rol
                </button>
                <button className="usuarios-btn-editar" onClick={abrirEditar}>
                  Editar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {crearModalOpen && (
        <CreateUserForm
          onSuccess={() => { setCrearModalOpen(false); cargarUsuarios(); }}
          onCancel={() => setCrearModalOpen(false)}
        />
      )}

      {editarModalOpen && resultado && !Array.isArray(resultado) && (
        <EditUserForm
          usuario={resultado}
          onSuccess={(actualizado) => { setResultado(actualizado); setEditarModalOpen(false); }}
          onCancel={() => setEditarModalOpen(false)}
        />
      )}

      {eliminarModalOpen && resultado && !Array.isArray(resultado) && (
        <div className="modal-overlay" onClick={() => setEliminarModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminar usuario</h2>
            <p className="modal-confirmar-texto">
              ¿Estás seguro de que querés eliminar a {resultado.nombre} {resultado.apellido}?
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

      {cambiarRolModalOpen && resultado && !Array.isArray(resultado) && (
        <div className="modal-overlay" onClick={() => setCambiarRolModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Cambiar rol</h2>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-rol">Nuevo rol</label>
              <select
                id="nuevo-rol"
                className="modal-select"
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.nombre}>{r.nombre}</option>
                ))}
              </select>
            </div>
            {errorModal && <p className="modal-error" role="alert">{errorModal}</p>}
            <div className="modal-actions">
              <button type="button" className="modal-button-cancel" onClick={() => setCambiarRolModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="modal-button-submit" onClick={handleCambiarRol} disabled={guardando || !nuevoRol}>
                {guardando ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosPage;
