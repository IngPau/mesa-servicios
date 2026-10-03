// Muestra la prioridad de un ticket. Uso: <BadgePrioridad prioridad={ticket.prioridad} />
// TODO (diseño): colores por prioridad.
import { ETIQUETAS_PRIORIDAD } from '../utils/constantes';

export default function BadgePrioridad({ prioridad }) {
  return <span>{ETIQUETAS_PRIORIDAD[prioridad] || prioridad}</span>;
}
