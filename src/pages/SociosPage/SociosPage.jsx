import { useState, useEffect } from 'react';
import { getSocios, createSocio, updateSocio, deleteSocio } from '../../services/sociosService';
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

function getValorOrden(socio, campo) {
  const val = socio[campo];
  if (val && typeof val === 'object') return String(val.nombre ?? '').toLowerCase();
  return String(val ?? '').toLowerCase();
}

const ICONOS_ORDEN = { asc: ' ↑', desc: ' ↓', none: ' ↕' };

const FORM_CREAR_INICIAL = {
  nombre: '', apellido: '', fecha_nacimiento: '',
  tipo_doc: 'DNI', nro_documento: '', genero: 'M',
  email: '', telefono: '', direccion: '',
};

function initFormEditar(socio) {
  return {
    nombre: socio.nombre ?? '',
    apellido: socio.apellido ?? '',
    fecha_nacimiento: socio.fecha_nacimiento ?? '',
    nro_documento: socio.nro_documento ?? '',
    genero: '',
    email: socio.email ?? '',
    telefono: socio.telefono ?? '',
    direccion: '',
  };
}

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
  const [formCrear, setFormCrear] = useState(FORM_CREAR_INICIAL);
  const [formEditar, setFormEditar] = useState({});
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

  function abrirCrear() {
    setFormCrear(FORM_CREAR_INICIAL);
    setErrorModal('');
    setCrearModalOpen(true);
  }

  function abrirEditar() {
    setFormEditar(initFormEditar(resultado));
    setErrorModal('');
    setEditarModalOpen(true);
  }

  function abrirEliminar() {
    setErrorModal('');
    setEliminarModalOpen(true);
  }

  async function handleCrear(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorModal('');
    try {
      await createSocio(formCrear);
      setCrearModalOpen(false);
      handleVerTodos();
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorModal('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else if (err.message === 'socio-duplicado') {
        setErrorModal('Ya existe un socio con ese documento o email.');
      } else {
        setErrorModal('Error al crear el socio. Verificá los datos e intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorModal('');
    const updates = {};
    Object.entries(formEditar).forEach(([k, v]) => {
      if (v !== '') updates[k] = v;
    });
    try {
      const socioActualizado = await updateSocio(resultado.id, updates);
      setResultado(socioActualizado);
      setEditarModalOpen(false);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setErrorModal('El servicio no está disponible en este momento. Intentá de nuevo más tarde.');
      } else {
        setErrorModal('Error al modificar el socio. Intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
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
        <button className="socios-crear-button" onClick={abrirCrear} disabled={loading}>
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
        <div className="modal-overlay" onClick={() => setCrearModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Crear socio</h2>
            <form onSubmit={handleCrear}>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-nombre">Nombre</label>
                <input id="crear-nombre" className="modal-input" type="text" required
                  value={formCrear.nombre}
                  onChange={(e) => setFormCrear(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-apellido">Apellido</label>
                <input id="crear-apellido" className="modal-input" type="text" required
                  value={formCrear.apellido}
                  onChange={(e) => setFormCrear(p => ({ ...p, apellido: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-fecha">Fecha de nacimiento</label>
                <input id="crear-fecha" className="modal-input" type="date" required
                  value={formCrear.fecha_nacimiento}
                  onChange={(e) => setFormCrear(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-tipo-doc">Tipo de documento</label>
                <select id="crear-tipo-doc" className="modal-select" required
                  value={formCrear.tipo_doc}
                  onChange={(e) => setFormCrear(p => ({ ...p, tipo_doc: e.target.value }))}>
                  <option value="DNI">DNI</option>
                  <option value="PAS">PAS</option>
                  <option value="LE">LE</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-nro-doc">N° de documento</label>
                <input id="crear-nro-doc" className="modal-input" type="text" required
                  value={formCrear.nro_documento}
                  onChange={(e) => setFormCrear(p => ({ ...p, nro_documento: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-genero">Género</label>
                <select id="crear-genero" className="modal-select" required
                  value={formCrear.genero}
                  onChange={(e) => setFormCrear(p => ({ ...p, genero: e.target.value }))}>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="X">X</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-email">Email</label>
                <input id="crear-email" className="modal-input" type="email" required
                  value={formCrear.email}
                  onChange={(e) => setFormCrear(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-telefono">Teléfono</label>
                <input id="crear-telefono" className="modal-input" type="text"
                  value={formCrear.telefono}
                  onChange={(e) => setFormCrear(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="crear-direccion">Dirección</label>
                <input id="crear-direccion" className="modal-input" type="text"
                  value={formCrear.direccion}
                  onChange={(e) => setFormCrear(p => ({ ...p, direccion: e.target.value }))} />
              </div>
              {errorModal && <p className="modal-error" role="alert">{errorModal}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-button-cancel" onClick={() => setCrearModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button-submit" disabled={guardando}>
                  {guardando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar socio */}
      {editarModalOpen && (
        <div className="modal-overlay" onClick={() => setEditarModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Editar socio</h2>
            <form onSubmit={handleEditar}>
              <div className="modal-field">
                <label className="modal-label">Nombre</label>
                <input className="modal-input" type="text"
                  value={formEditar.nombre}
                  onChange={(e) => setFormEditar(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Apellido</label>
                <input className="modal-input" type="text"
                  value={formEditar.apellido}
                  onChange={(e) => setFormEditar(p => ({ ...p, apellido: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Fecha de nacimiento</label>
                <input className="modal-input" type="date"
                  value={formEditar.fecha_nacimiento}
                  onChange={(e) => setFormEditar(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label">N° de documento</label>
                <input className="modal-input" type="text"
                  value={formEditar.nro_documento}
                  onChange={(e) => setFormEditar(p => ({ ...p, nro_documento: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Género</label>
                <select className="modal-select"
                  value={formEditar.genero}
                  onChange={(e) => setFormEditar(p => ({ ...p, genero: e.target.value }))}>
                  <option value="">— sin cambiar —</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="X">X</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Email</label>
                <input className="modal-input" type="email"
                  value={formEditar.email}
                  onChange={(e) => setFormEditar(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Teléfono</label>
                <input className="modal-input" type="text"
                  value={formEditar.telefono}
                  onChange={(e) => setFormEditar(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Dirección</label>
                <input className="modal-input" type="text"
                  value={formEditar.direccion}
                  onChange={(e) => setFormEditar(p => ({ ...p, direccion: e.target.value }))} />
              </div>
              {errorModal && <p className="modal-error" role="alert">{errorModal}</p>}
              <div className="modal-actions">
                <button type="button" className="modal-button-cancel" onClick={() => setEditarModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button-submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
