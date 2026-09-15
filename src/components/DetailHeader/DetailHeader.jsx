import { BackButton } from '../BackButton/BackButton';
import './DetailHeader.css';

/**
 * Encabezado de una vista de detalle: BackButton, título, badge de estado y
 * acciones alineadas a la derecha (secundarias `.btn-outline`, destructiva al
 * final con `.btn-outline-danger`).
 *
 * Si `titulo` es falsy (detalle todavía cargando o con error) solo renderiza el
 * BackButton, así la página no necesita duplicar el botón "Volver" por estado.
 */
export function DetailHeader({ onBack, titulo, subtitulo = null, estado = null, acciones = null, children }) {
  return (
    <header className="detail-header">
      <BackButton onClick={onBack} />

      {titulo && (
        <div className="detail-header__row">
          <div className="detail-header__texto">
            <div className="detail-header__titulo-row">
              <h1 className="detail-header__titulo">{titulo}</h1>
              {estado}
            </div>
            {subtitulo && <p className="detail-header__subtitulo">{subtitulo}</p>}
          </div>
          {acciones && <div className="detail-header__acciones">{acciones}</div>}
        </div>
      )}

      {children}
    </header>
  );
}

export default DetailHeader;
