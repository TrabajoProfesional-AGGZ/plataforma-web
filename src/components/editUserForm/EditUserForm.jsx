import { useState } from 'react';
import { editarUsuario } from '../../services/usuariosService';

export function EditUserForm({ usuario, onSuccess, onCancel }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellido, setApellido] = useState(usuario.apellido);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim()) return;
    setGuardando(true);
    setError('');
    try {
      const actualizado = await editarUsuario(usuario.id, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
      });
      onSuccess(actualizado);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setError('Error al guardar los cambios. Intentá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Editar usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label" htmlFor="edit-nombre">Nombre</label>
            <input
              id="edit-nombre"
              type="text"
              className="modal-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="modal-field">
            <label className="modal-label" htmlFor="edit-apellido">Apellido</label>
            <input
              id="edit-apellido"
              type="text"
              className="modal-input"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-button-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="modal-button-submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
