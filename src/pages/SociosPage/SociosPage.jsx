import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { getSocios, deleteSocio } from '../../services/sociosService';
import { CreateSocioForm } from '../../components/createForm/CreateSocioForm';
import { EditSocioForm } from '../../components/editForm/EditSocioForm';
import ConfirmDeleteModal from '../../components/confirmDeleteModal/ConfirmDeleteModal';
import { usePermiso } from '../../hooks/usePermiso';
import { useSortedList } from '../../hooks/useSortedList';
import logo from '../../assets/logo_socio.png';
import logoVerde from '../../assets/logo-verde.png';
import logoRojo from '../../assets/logo-rojo.png';
import logoAmarillo from '../../assets/logo-amarillo.png';
import logoNaranja from '../../assets/logo-naranja.png'
import './SociosPage.css';
import '../../styles/SocioCard.css';
import '../../styles/PageTableHeader.css';

const ESTADO_CONFIG = {
  'Activo': { logo: logoVerde,    bg: '#a7daa7', border: '#0D6E0D' },
  'Moroso': { logo: logoRojo,     bg: '#f4bebe', border: '#A01414' },
  'Inactivo': {logo: logoAmarillo, bg: '#f5e9b2', border: '#9A6200' },
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



function SociosPage() {
  const puedeCrear = usePermiso('crear_socio');
  const puedeEditar = usePermiso('editar_socio');
  const puedeBorrar = usePermiso('borrar_socio');

  const cacheSociosRef = useRef(null);
  const buscarTimeoutRef = useRef(null);

  const [nroSocio, setNroSocio] = useState('');
  const [modo, setModo] = useState('idle'); // idle | socio | lista | no-encontrado
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { orden, setOrden, toggleOrden, iconoOrden, aplicarOrden } = useSortedList(getValorOrden);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  useEffect(() => {
    cargarSocios();
    return () => {
      if (buscarTimeoutRef.current) clearTimeout(buscarTimeoutRef.current);
    };
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

  async function cargarSocios() {
    setLoading(true);
    setError(null);
    try {
      const socios = await getSocios();
      cacheSociosRef.current = socios;
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

  async function recargarSocios() {
    setNroSocio('');
    setOrden({ campo: null, dir: 'asc' });
    setFiltroEstado('');
    setFiltroAbierto(false);
    setFiltroCategoria('');
    cacheSociosRef.current = null;
    await cargarSocios();
  }

  async function handleBuscar(e) {
    e.preventDefault();
    if (!nroSocio.trim()) return;
    const socios = cacheSociosRef.current;
    if (socios !== null) {
      if (buscarTimeoutRef.current) clearTimeout(buscarTimeoutRef.current);
      setLoading(true);
      const nro = nroSocio.trim();
      buscarTimeoutRef.current = setTimeout(() => {
        buscarTimeoutRef.current = null;
        const encontrado = socios.find(s => s.nro_socio === nro);
        if (encontrado) {
          setResultado([encontrado]);
          setModo('lista');
        } else {
          setModo('no-encontrado');
          setResultado(null);
        }
        setLoading(false);
      }, 400);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSocios();
      cacheSociosRef.current = data;
      const encontrado = data.find(s => s.nro_socio === nroSocio.trim());
      if (encontrado) {
        setResultado([encontrado]);
        setModo('lista');
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

  function handleVerTodos() {
    if (buscarTimeoutRef.current) {
      clearTimeout(buscarTimeoutRef.current);
      buscarTimeoutRef.current = null;
      setLoading(false);
    }
    setNroSocio('');
    setOrden({ campo: null, dir: 'asc' });
    setFiltroEstado('');
    setFiltroAbierto(false);
    setFiltroCategoria('');
    setError(null);
    if (cacheSociosRef.current !== null) {
      setResultado(cacheSociosRef.current);
      setModo('lista');
      return;
    }
    cargarSocios();
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
      cacheSociosRef.current = null;
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
        <div className="socios-toolbar-left">
          <form className="socios-search-form" onSubmit={handleBuscar}>
            <div className="socios-search-container">
              <Search size={16} aria-hidden="true" />
              <input
                className="socios-search-input"
                type="text"
                placeholder="Buscar por N° de socio"
                value={nroSocio}
                onChange={(e) => setNroSocio(e.target.value)}
              />
            </div>
            <button
              className="socios-search-button"
              type="submit"
              disabled={loading || !nroSocio.trim()}
            >
              Buscar
            </button>
          </form>
        </div>
        <div className="socios-toolbar-right">
          <button className="socios-ver-todos-button" onClick={handleVerTodos}>
            Ver todos
          </button>
          {puedeCrear && (
            <button className="socios-crear-button" onClick={() => setCrearModalOpen(true)} disabled={loading}>
              <Plus size={15} aria-hidden="true" />
              Crear socio
            </button>
          )}
        </div>
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
              {puedeBorrar && (
                <button className="socios-btn-eliminar" onClick={abrirEliminar}>
                  Eliminar
                </button>
              )}
              {puedeEditar && (
                <button className="socios-btn-editar" onClick={abrirEditar}>
                  Editar
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {!loading && modo === 'lista' && Array.isArray(resultado) && (() => {
        if (resultado.length === 0) {
          return (
            <div className="socios-table-wrapper">
              <p className="socios-table-empty">No hay socios registrados.</p>
            </div>
          );
        }
        const estadosUnicos = [...new Set(resultado.map(s => s.estado.nombre))].sort();
        const categoriasUnicas = [...new Set(resultado.map(s => s.categoria.nombre))].sort();
        const listaFiltrada = resultado.filter(s => {
          const matchEstado = filtroEstado ? s.estado.nombre === filtroEstado : true;
          const matchCategoria = filtroCategoria ? s.categoria.nombre === filtroCategoria : true;
          return matchEstado && matchCategoria;
        });
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
                <div className="socios-filtros-dropdowns">
                  <div className="socios-filtros-grupo">
                    <select
                      className="socios-filtro-select"
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                    >
                      <option value="">Categoría: Todas</option>
                      {categoriasUnicas.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="socios-filtros-grupo">
                    <select
                      id="filtro-estado"
                      className="socios-filtro-select"
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                      <option value="">Estado: Todos</option>
                      {estadosUnicos.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="socios-table-wrapper">
              {listaFiltrada.length === 0 ? (
                <p className="socios-table-empty">No hay socios con los filtros seleccionados.</p>
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
            </div>
          </>
        );
      })()}

      {/* Modal crear socio */}
      {crearModalOpen && (
        <CreateSocioForm
          onSuccess={() => { setCrearModalOpen(false); recargarSocios(); }}
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

      <ConfirmDeleteModal
        open={eliminarModalOpen && !!resultado}
        titulo="Eliminar socio"
        mensaje={`¿Estás seguro de que querés eliminar al socio N° ${resultado?.nro_socio}?`}
        onConfirm={handleEliminar}
        onCancel={() => setEliminarModalOpen(false)}
        guardando={guardando}
        errorModal={errorModal}
      />
    </div>
  );
}

export default SociosPage;
