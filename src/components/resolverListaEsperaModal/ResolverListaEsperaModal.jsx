import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { resolverListaEspera } from '../../services/disciplinasService';
import '../createForm/CreateSocioForm.css';
import { ModalOverlay } from '../createForm/ModalOverlay';

function mensajeError(err) {
  if (err?.message === 'servicio-no-disponible') return 'El servicio no está disponible. Intentá de nuevo más tarde.';
  if (err?.message === 'no-en-espera') return 'Este socio ya no está en la lista de espera.';
  return 'No se pudo procesar la acción. Intentá de nuevo.';
}

/**
 * Modal con dos acciones explícitas para resolver a un socio en lista de espera
 * de una disciplina: pasar su inscripción a activa, o eliminarlo de la lista.
 */
export function ResolverListaEsperaModal({ idDisciplina, idSocio, nombreSocio, onSuccess, onCancel }) {
  const [accionEnCurso, setAccionEnCurso] = useState(null);
  const [error, setError] = useState('');

  async function handleAccion(accion) {
    setAccionEnCurso(accion);
    setError('');
    try {
      await resolverListaEspera(idDisciplina, idSocio, accion);
      onSuccess();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setAccionEnCurso(null);
    }
  }

  return (
    <ModalOverlay onClose={onCancel} ariaLabel={`Quitar de lista de espera: ${nombreSocio}`}>
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="csf-outer-card"
      >
        <div className="csf-header">
          <h1>Lista de espera</h1>
          <p>{nombreSocio}</p>
        </div>

        <div className="csf-card">
          <div className="csf-fields">
            {error && <p className="csf-form-error" role="alert">{error}</p>}

            <motion.button
              type="button"
              onClick={() => handleAccion('activar')}
              disabled={!!accionEnCurso}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="csf-btn-submit"
            >
              {accionEnCurso === 'activar' ? 'Procesando...' : 'Pasar inscripción a activa'}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleAccion('eliminar')}
              disabled={!!accionEnCurso}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="csf-btn-danger"
            >
              {accionEnCurso === 'eliminar' ? 'Procesando...' : 'Eliminar de la lista de espera'}
            </motion.button>

            <div className="csf-nav csf-nav--end">
              <motion.button
                type="button"
                onClick={onCancel}
                disabled={!!accionEnCurso}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="csf-btn-back"
              >
                Cancelar
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

ResolverListaEsperaModal.propTypes = {
  idDisciplina: PropTypes.string.isRequired,
  idSocio: PropTypes.string.isRequired,
  nombreSocio: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
