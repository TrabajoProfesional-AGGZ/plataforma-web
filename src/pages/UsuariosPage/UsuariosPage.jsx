import { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserRole, createUser } from '../../services/usuariosService';
import logo from '../../assets/logo_socio.png';
import './UsuariosPage.css';

const FORM_INICIAL = { email: '', password: '', role: 'admin' };

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState(FORM_INICIAL);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      setUsuarios(data);
    } catch {
      setError('No se pudieron cargar los usuarios. Verificá que el servidor esté disponible.');
    } finally {
      setLoading(false);
    }
  }

  function abrirModal() {
    setNuevoUsuario(FORM_INICIAL);
    setErrorCrear('');
    setModalOpen(true);
  }

  const cerrarModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') cerrarModal();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, cerrarModal]);

  async function handleCrearUsuario(e) {
    e.preventDefault();
    setCreando(true);
    setErrorCrear('');
    try {
      await createUser(nuevoUsuario.email, nuevoUsuario.password, nuevoUsuario.role);
      cerrarModal();
      cargarUsuarios();
    } catch {
      setErrorCrear('No se pudo crear el usuario. Verificá los datos e intentá de nuevo.');
    } finally {
      setCreando(false);
    }
  }

  async function handleCambiarRol(uid, rolActual) {
    const nuevoRol = rolActual === 'admin' ? 'superAdmin' : 'admin';
    setActualizando(uid);
    try {
      await updateUserRole(uid, nuevoRol);
      setUsuarios((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: nuevoRol } : u))
      );
    } catch {
      setError('No se pudo actualizar el rol. Intentá de nuevo.');
    } finally {
      setActualizando(null);
    }
  }

  return (
    <div className="usuarios-page">
      <div className="usuarios-header">
        <h1 className="usuarios-title">Usuarios</h1>
        <button className="usuarios-crear-button" onClick={abrirModal}>
          Crear usuario
        </button>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Crear usuario</h2>
            <form onSubmit={handleCrearUsuario}>
              <div className="modal-field">
                <label className="modal-label" htmlFor="nuevo-email">Email</label>
                <input
                  id="nuevo-email"
                  type="email"
                  className="modal-input"
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario((v) => ({ ...v, email: e.target.value }))}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="nuevo-password">Contraseña</label>
                <input
                  id="nuevo-password"
                  type="password"
                  className="modal-input"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario((v) => ({ ...v, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="nuevo-rol">Rol</label>
                <select
                  id="nuevo-rol"
                  className="modal-select"
                  value={nuevoUsuario.role}
                  onChange={(e) => setNuevoUsuario((v) => ({ ...v, role: e.target.value }))}
                >
                  <option value="admin">admin</option>
                  <option value="superAdmin">superAdmin</option>
                </select>
              </div>
              {errorCrear && (
                <p className="modal-error" role="alert">{errorCrear}</p>
              )}
              <div className="modal-actions">
                <button type="button" className="modal-button-cancel" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="modal-button-submit" disabled={creando}>
                  {creando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <p className="usuarios-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="usuarios-search-loading">
          <img src={logo} alt="" className="loading-logo" />
        </div>
      ) : (
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.uid}>
                <td>{usuario.email}</td>
                <td>
                  <span className={`rol-badge rol-${usuario.role}`}>
                    {usuario.role}
                  </span>
                </td>
                <td>
                  <button
                    className="usuarios-rol-button"
                    onClick={() => handleCambiarRol(usuario.uid, usuario.role)}
                    disabled={actualizando === usuario.uid}
                  >
                    {actualizando === usuario.uid
                      ? 'Actualizando...'
                      : usuario.role === 'admin'
                      ? 'Promover a superAdmin'
                      : 'Degradar a admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsuariosPage;
