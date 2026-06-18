import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { fetchUsuarios, eliminarUsuario } from '../../services/usuariosService';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { fetchRoles } from '../../services/rolesService';
import { CreateUserForm } from '../../components/createUserForm/CreateUserForm';
import { EditUserForm } from '../../components/editUserForm/EditUserForm';
import { CambiarRolForm } from '../../components/cambiarRolForm/CambiarRolForm';
import { PermisosModal } from '../../components/permisosModal/PermisosModal';
import { usePermiso } from '../../hooks/usePermiso';
import { useSortedList } from '../../hooks/useSortedList';
import { useAuthContext } from '../../context/AuthContext';
import logo from '../../assets/logo_socio.png';
import logoVerde from '../../assets/logo-verde.png';
import logoAmarillo from '../../assets/logo-amarillo.png';
import './UsuariosPage.css';
import '../../styles/ListPage.css';
import '../../styles/ListDetailShared.css';
import '../../styles/PageTableHeader.css';

const ESTADO_CONFIG = {
  'Activo':   { logo: logoVerde,    bg: '#8ac98ab0', border: '#0D6E0D' },
  'Inactivo': { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' },
};
const ESTADO_DEFAULT = { logo: logoAmarillo, bg: '#f4ecb5ee', border: '#9A6200' };

function estadoConfig(nombre) {
  return ESTADO_CONFIG[nombre] ?? ESTADO_DEFAULT;
}

function getValorOrden(usuario, campo) {
  if (campo === 'rol') return String(usuario.rol?.nombre ?? '').toLowerCase();
  if (campo === 'estado') return String(usuario.estado?.nombre ?? '').toLowerCase();
  return String(usuario[campo] ?? '').toLowerCase();
}

function UsuariosPage() {
  const puedeCrear = usePermiso('crear_usuario');
  const puedeEditar = usePermiso('editar_usuario');
  const puedeBorrar = usePermiso('borrar_usuario');
  const { userData } = useAuthContext();

  const cacheUsuariosRef = useRef(null);
  const buscarTimeoutRef = useRef(null);

  const [busqueda, setBusqueda] = useState('');
  const [modo, setModo] = useState('lista');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setOrden, toggleOrden, iconoOrden, aplicarOrden } = useSortedList(getValorOrden);

  const [filtroRol, setFiltroRol] = useState('');
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const [roles, setRoles] = useState([]);

  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [cambiarRolModalOpen, setCambiarRolModalOpen] = useState(false);
  const [permisosModalOpen, setPermisosModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    fetchYActualizarUsuarios();
    fetchRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {});
    return () => {
      if (buscarTimeoutRef.current) clearTimeout(buscarTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyModalOpen = crearModalOpen || editarModalOpen || eliminarModalOpen || cambiarRolModalOpen || permisosModalOpen;
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
  }, [anyModalOpen, crearModalOpen, editarModalOpen, eliminarModalOpen, cambiarRolModalOpen, permisosModalOpen]);

  async function fetchYActualizarUsuarios() {
    setLoading(true);
    setError(null);
    try {
      const usuarios = await fetchUsuarios();
      cacheUsuariosRef.current = usuarios;
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

  async function recargarUsuarios() {
    setBusqueda('');
    setFiltroBusqueda('');
    setFiltroRol('');
    setFiltroAbierto(false);
    setOrden({ campo: null, dir: 'asc' });
    cacheUsuariosRef.current = null;
    await fetchYActualizarUsuarios();
  }

  function handleBuscar(e) {
    e.preventDefault();
    if (buscarTimeoutRef.current) clearTimeout(buscarTimeoutRef.current);
    setLoading(true);
    const termino = busqueda.trim().toLowerCase();
    buscarTimeoutRef.current = setTimeout(() => {
      buscarTimeoutRef.current = null;
      setFiltroBusqueda(termino);
      setModo('lista');
      setLoading(false);
    }, 400);
  }

  function handleVerTodos() {
    if (buscarTimeoutRef.current) {
      clearTimeout(buscarTimeoutRef.current);
      buscarTimeoutRef.current = null;
      setLoading(false);
    }
    setBusqueda('');
    setFiltroBusqueda('');
    setFiltroRol('');
    setFiltroAbierto(false);
    setOrden({ campo: null, dir: 'asc' });
    setError(null);
    if (cacheUsuariosRef.current !== null) {
      setResultado(cacheUsuariosRef.current);
      setModo('lista');
      return;
    }
    fetchYActualizarUsuarios();
  }

  function abrirEditar() {
    setEditarModalOpen(true);
  }

  function abrirEliminar() {
    setErrorModal('');
    setEliminarModalOpen(true);
  }

  function abrirCambiarRol() {
    setCambiarRolModalOpen(true);
  }

  async function handleEliminar() {
    setGuardando(true);
    setErrorModal('');
    try {
      await eliminarUsuario(resultado.id);
      setEliminarModalOpen(false);
      await recargarUsuarios();
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
        <div className="usuarios-toolbar-left">
          <form className="usuarios-search-form" onSubmit={handleBuscar}>
            <div className="usuarios-search-container">
              <Search size={16} aria-hidden="true" />
              <input
                className="usuarios-search-input"
                type="text"
                placeholder="Buscar por nombre, apellido o email"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              className="usuarios-search-button"
              type="submit"
              disabled={loading || !busqueda.trim()}
            >
              Buscar
            </button>
          </form>
        </div>
        <div className="usuarios-toolbar-right">
          <button className="usuarios-ver-todos-button" onClick={handleVerTodos}>
            Ver todos
          </button>
          {puedeCrear && (
            <button className="usuarios-crear-button" onClick={() => setCrearModalOpen(true)} disabled={loading}>
              <Plus size={15} aria-hidden="true" />
              Crear usuario
            </button>
          )}
        </div>
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

          <div className="usuarios-table-wrapper">
            {listaBase.length === 0 ? (
              <p className="usuarios-table-empty">No hay usuarios registrados.</p>
            ) : listaFiltrada.length === 0 ? (
              <p className="usuarios-table-empty">No hay usuarios con los filtros seleccionados.</p>
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
          </div>
        </>
      )}

      {!loading && modo === 'usuario' && resultado && !Array.isArray(resultado) && (() => {
        const cfg = estadoConfig(resultado.estado?.nombre);
        const permisos = resultado.rol?.permisos ?? [];
        const esMismoUsuario = resultado.id === userData?.usuario_id;
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
                  <div className="usuarios-card-row">
                    <button
                      className="usuarios-btn-ver-permisos"
                      style={{ '--card-bg': cfg.bg }}
                      onClick={() => setPermisosModalOpen(true)}
                    >
                      Ver permisos
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="usuarios-card-actions">
              {puedeBorrar && (
                <button className="usuarios-btn-eliminar" onClick={abrirEliminar}>
                  Eliminar
                </button>
              )}
              <div className="usuarios-card-actions-right">
                {puedeEditar && !esMismoUsuario && (
                  <button className="usuarios-btn-cambiar-rol" onClick={abrirCambiarRol}>
                    Cambiar rol
                  </button>
                )}
                {puedeEditar && (
                  <button className="usuarios-btn-editar" onClick={abrirEditar}>
                    Editar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {crearModalOpen && (
        <CreateUserForm
          onSuccess={() => { setCrearModalOpen(false); recargarUsuarios(); }}
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

      <ConfirmDeleteModal
        open={eliminarModalOpen && !!resultado && !Array.isArray(resultado)}
        titulo="Eliminar usuario"
        mensaje={`¿Estás seguro de que querés eliminar a ${resultado?.nombre} ${resultado?.apellido}?`}
        onConfirm={handleEliminar}
        onCancel={() => setEliminarModalOpen(false)}
        guardando={guardando}
        errorModal={errorModal}
      />

      {cambiarRolModalOpen && resultado && !Array.isArray(resultado) && (
        <CambiarRolForm
          usuario={resultado}
          roles={roles}
          onSuccess={(actualizado) => { setResultado(actualizado); setCambiarRolModalOpen(false); }}
          onCancel={() => setCambiarRolModalOpen(false)}
        />
      )}

      {permisosModalOpen && resultado && !Array.isArray(resultado) && (
        <PermisosModal
          permisos={(resultado.rol?.permisos ?? []).map((p) => p.nombre)}
          onClose={() => setPermisosModalOpen(false)}
        />
      )}
    </div>
  );
}

export default UsuariosPage;
