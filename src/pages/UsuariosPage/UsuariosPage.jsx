import { useState, useEffect } from 'react';
import { getUsers, updateUserRole } from '../../services/usuariosService';
import './UsuariosPage.css';

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(null);

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
      <h1 className="usuarios-title">Usuarios</h1>

      {error && (
        <p className="usuarios-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="usuarios-loading">Cargando usuarios...</p>
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
