// Muestra el estado de un ticket. Uso: <BadgeEstado estado={ticket.estado} />
// TODO (diseño): colores por estado.
import { ETIQUETAS_ESTADO } from '../utils/constantes';

export default function BadgeEstado({ estado }) {
  return <span>{ETIQUETAS_ESTADO[estado] || estado}</span>;
}
