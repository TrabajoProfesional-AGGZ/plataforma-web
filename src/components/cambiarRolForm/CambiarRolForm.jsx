import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { cambiarRolUsuario } from '../../services/usuariosService';
import '../createForm/CreateSocioForm.css';
import { StyledSelect } from '../createForm/FormFields';
import { ModalOverlay } from '../createForm/ModalOverlay';
import { SPRING, slideVariants } from '../../styles/motion';

/**
 * Modal de dos pasos para cambiar el rol de un usuario administrativo:
 * selección de rol nuevo y confirmación (advirtiendo que cambia también
 * sus permisos). Al confirmar, llama a `cambiarRolUsuario` y notifica el
 * resultado vía `onSuccess`.
 */
export function CambiarRolForm({ usuario, roles, onSuccess, onCancel }) {
  const [fase, setFase] = useState('seleccion');
  const [direction, setDirection] = useState(1);
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
      setDirection(-1);
      setFase('seleccion');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onCancel} ariaLabel={`Cambiar rol de ${usuario.nombre} ${usuario.apellido}`}>
        <div className="csf-outer-card">
          <div className="csf-header">
            <h1>Cambiar rol</h1>
            <p>{usuario.nombre} {usuario.apellido}</p>
          </div>

          <div className="csf-card">
            <AnimatePresence mode="wait" custom={direction}>

              {fase === 'seleccion' && (
                <motion.div
                  key="seleccion"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={SPRING.quick}
                  className="csf-fields"
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
                      onClick={() => { setDirection(1); setFase('confirmacion'); }}
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
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={SPRING.quick}
                  className="csf-fields"
                >
                  <div className="confirm-aviso confirm-aviso--warning">
                    <AlertTriangle size={20} color="var(--status-warning-border)" strokeWidth={2} className="confirm-aviso-icono" />
                    <p className="confirm-aviso-texto">
                      Advertencia: modificar el rol de un usuario modifica también sus permisos. ¿Confirmar?
                    </p>
                  </div>
                  <div className="csf-nav csf-nav--between" style={{ marginTop: 8 }}>
                    <motion.button
                      type="button"
                      onClick={() => { setDirection(-1); setFase('seleccion'); }}
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
        </div>
    </ModalOverlay>
  );
}
