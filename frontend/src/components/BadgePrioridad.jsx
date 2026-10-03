import './Badges.css';
import { ETIQUETAS_PRIORIDAD } from '../utils/constantes';

// Muestra la prioridad del ticket. Usa un marcador cuadrado (el estado usa círculo)
// para que no dependa solo del color.
// Uso: <BadgePrioridad prioridad={ticket.prioridad} />
export default function BadgePrioridad({ prioridad }) {
  return (
    <span className={`badge badge--prioridad badge--${prioridad}`}>
      {ETIQUETAS_PRIORIDAD[prioridad] || prioridad}
    </span>
  );
}
