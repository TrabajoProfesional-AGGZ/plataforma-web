import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import PropTypes from 'prop-types';
import { crearCompra } from '../../services/comprasService';
import { marcarPagadaCaja } from '../../services/finanzasService';
import { useBuscadorSocio } from '../../hooks/useBuscadorSocio';
import '../createForm/CreateSocioForm.css';
import { Field, StyledInput } from '../createForm/FormFields';
import { FormFooterActions } from '../createForm/FormFooterActions';
import { ModalOverlay } from '../createForm/ModalOverlay';
import { SocioBuscadorField } from '../createForm/SocioBuscadorField';

const AVISOS_ESTADO_SOCIO = {
  Moroso: 'No se puede crear una compra para este socio hasta que no regularice su situación financiera con el club.',
  Suspendido: 'No se puede crear una compra para este socio hasta que no termine su suspensión.',
};

const MENSAJES_ERROR_SUBMIT = {
  moroso: AVISOS_ESTADO_SOCIO.Moroso,
  suspendido: AVISOS_ESTADO_SOCIO.Suspendido,
  sin_stock: 'No queda stock suficiente de este producto.',
  producto_inactivo: 'Este producto ya no está disponible.',
};

export function CrearCompraForm({ producto, onSuccess, onCancel }) {
  const buscador = useBuscadorSocio();
  const [cantidad, setCantidad] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleConfirmar() {
    if (!buscador.socioSeleccionado) return;
    setGuardando(true);
    setSubmitError('');
    try {
      const compra = await crearCompra({
        id_producto: producto.id,
        id_socio: buscador.socioSeleccionado.id,
        cantidad,
      });
      await marcarPagadaCaja('compra', compra.id);
      onSuccess();
    } catch (e) {
      setSubmitError(MENSAJES_ERROR_SUBMIT[e.message] || 'No se pudo crear la compra. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onCancel} ariaLabel={`Crear compra: ${producto.nombre}`}>
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="csf-outer-card"
      >
        <div className="csf-header">
          <h1>Crear compra</h1>
          <p>{producto.nombre}</p>
        </div>

        <div className="csf-card">
          <div className="csf-fields">
            <SocioBuscadorField
              nroSocioInput={buscador.nroSocioInput}
              busquedaSocio={buscador.busquedaSocio}
              errorSocio={buscador.errorSocio}
              socioSeleccionado={buscador.socioSeleccionado}
              onChange={buscador.handleNroSocioChange}
              onBlurPreview={buscador.previewSocio}
              onBuscar={buscador.buscarSocio}
            />

            <Field label="Cantidad" icon={Package}>
              <StyledInput
                type="number"
                min={1}
                max={producto.stock}
                value={cantidad}
                onChange={(e) => {
                  const valor = Number(e.target.value);
                  setCantidad(Math.min(Math.max(valor || 1, 1), producto.stock));
                }}
              />
            </Field>

            {submitError && <p className="csf-form-error">{submitError}</p>}

            <FormFooterActions
              onCancel={onCancel}
              onSubmit={handleConfirmar}
              disabled={!buscador.socioSeleccionado || guardando}
              loading={guardando}
              submitLabel="Crear compra"
            />
          </div>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}

CrearCompraForm.propTypes = {
  producto: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    stock: PropTypes.number.isRequired,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
