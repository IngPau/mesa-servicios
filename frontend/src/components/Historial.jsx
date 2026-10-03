// Línea de tiempo con todo lo que le ha pasado al ticket (creación, asignación, cambios de estado).
// Uso: <Historial historial={ticket.historial} />
import './Historial.css';
import BadgeEstado from './BadgeEstado';
import { ETIQUETAS_ACCION_HISTORIAL } from '../utils/constantes';
import { formatearFecha } from '../utils/formato';

export default function Historial({ historial = [] }) {
  if (historial.length === 0) {
    return <p className="vacio">Este ticket todavía no tiene movimientos.</p>;
  }

  return (
    <ol className="historial">
      {historial.map((h, i) => (
        <li className="historial__item" key={`${h.fecha}-${i}`}>
          <div className="historial__titulo">
            <span>{ETIQUETAS_ACCION_HISTORIAL[h.accion] || h.accion}</span>
            {h.estado_anterior && <BadgeEstado estado={h.estado_anterior} />}
            {h.estado_anterior && h.estado_nuevo && <span aria-label="a">→</span>}
            {h.estado_nuevo && <BadgeEstado estado={h.estado_nuevo} />}
          </div>
          <div className="historial__meta">
            {h.usuario_id?.nombre || 'Sistema'} · {formatearFecha(h.fecha)}
          </div>
          {h.detalle && <div className="historial__detalle">{h.detalle}</div>}
        </li>
      ))}
    </ol>
  );
}