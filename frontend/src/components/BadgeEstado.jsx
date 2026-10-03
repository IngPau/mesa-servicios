import './Badges.css';
import { ETIQUETAS_ESTADO } from '../utils/constantes';

// Muestra el estado del ticket como una etiqueta de color.
// Uso: <BadgeEstado estado={ticket.estado} />
export default function BadgeEstado({ estado }) {
  return (
    <span className={`badge badge--${estado}`}>
      {ETIQUETAS_ESTADO[estado] || estado}
    </span>
  );
}
