import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { cambiarRolUsuario } from '../../services/usuariosService';
import '../createForm/CreateSocioForm.css';
import { StyledSelect } from '../createForm/FormFields';
import { ModalOverlay } from '../createForm/ModalOverlay';

// Props de animación (framer-motion) compartidas por ambos pasos del form.
const STEP_SHARED_PROPS = {
  animate: { x: 0, opacity: 1 },
  exit: { x: -52, opacity: 0 },
  transition: { duration: 0.26, ease: 'easeInOut' },
  className: 'csf-fields',
};

/**
 * Modal de dos pasos para cambiar el rol de un usuario administrativo:
 * selección de rol nuevo y confirmación (advirtiendo que cambia también
 * sus permisos). Al confirmar, llama a `cambiarRolUsuario` y notifica el
 * resultado vía `onSuccess`.
 */
export function CambiarRolForm({ usuario, roles, onSuccess, onCancel }) {
  const [fase, setFase] = useState('seleccion');
  const [rolSeleccionado, setRolSeleccionado] = useState(usuario.rol?.nombre ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmar() {
    setGuardando(true);
    setError('');
    try {
      const actualizado = await cambiarRolUsuario(usuario.id, rolSeleccionado);
      onSuccess(actualizado);
    } catch (err) {
      if (err.message === 'servicio-no-disponible') {
        setError('El servicio no está disponible. Intentá de nuevo más tarde.');
      } else {
        setError('Error al cambiar el rol. Intentá de nuevo.');
      }
      setFase('seleccion');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onCancel} ariaLabel={`Cambiar rol de ${usuario.nombre} ${usuario.apellido}`}>
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="csf-outer-card"
        >
          <div className="csf-header">
            <h1>Cambiar rol</h1>
            <p>{usuario.nombre} {usuario.apellido}</p>
          </div>

          <div className="csf-card">
            <AnimatePresence mode="wait">

              {fase === 'seleccion' && (
                <motion.div
                  key="seleccion"
                  initial={{ x: 0, opacity: 0 }}
                  {...STEP_SHARED_PROPS}
                >
                  <div className="csf-field">
                    <label className="csf-label">
                      <Shield size={13} strokeWidth={2} />
                      Nuevo rol
                    </label>
                    <StyledSelect
                      value={rolSeleccionado}
                      onChange={(e) => setRolSeleccionado(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.nombre}>{r.nombre}</option>
                      ))}
                    </StyledSelect>
                  </div>
                  {error && <p className="csf-form-error">{error}</p>}
                  <div className="csf-nav csf-nav--between">
                    <motion.button
                      type="button"
                      onClick={onCancel}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-back"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setFase('confirmacion')}
                      disabled={!rolSeleccionado}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-next"
                    >
                      Confirmar
                      <ChevronRight size={17} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {fase === 'confirmacion' && (
                <motion.div
                  key="confirmacion"
                  initial={{ x: 52, opacity: 0 }}
                  {...STEP_SHARED_PROPS}
                >
                  <div style={{
                    backgroundColor: 'var(--status-warning-bg)',
                    border: '1px solid var(--status-warning-border)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}>
                    <AlertTriangle size={20} color="var(--status-warning-border)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--status-warning-border)', lineHeight: 1.5 }}>
                      Advertencia: modificar el rol de un usuario modifica también sus permisos. ¿Confirmar?
                    </p>
                  </div>
                  <div className="csf-nav csf-nav--between" style={{ marginTop: 8 }}>
                    <motion.button
                      type="button"
                      onClick={() => setFase('seleccion')}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-back"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleConfirmar}
                      disabled={guardando}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-submit"
                    >
                      {guardando ? (
                        <>
                          <motion.span
                            className="csf-spinner"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          />
                          Guardando...
                        </>
                      ) : 'Sí'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
    </ModalOverlay>
  );
}
