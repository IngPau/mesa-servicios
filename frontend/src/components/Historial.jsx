// Línea de tiempo del historial de un ticket.
// Uso: <Historial historial={ticket.historial} />
//
// TODO: mostrar cada evento en orden cronológico con:
//   - accion (ETIQUETAS_ACCION_HISTORIAL), estado_anterior -> estado_nuevo
//   - quién lo hizo: evento.usuario_id.nombre (y su rol)
//   - a quién se asignó (solo en asignaciones): evento.responsable_id?.nombre
//   - detalle y fecha (formatearFecha)
// Estructura de cada evento: ver "Objeto ticket" en docs/CONTEXTO_PROYECTO_Y_API.md (sección 8.4)
export default function Historial({ historial = [] }) {
  return (
    <section>
      <h3>Historial</h3>
      <p>Pendiente de implementar ({historial.length} eventos)</p>
    </section>
  );
}
