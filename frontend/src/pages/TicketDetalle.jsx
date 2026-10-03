// Detalle de un ticket y acciones sobre él.   Módulo asignado a: ________
//
// TODO:
//  1. Leer el id de la URL (useParams) y cargar obtenerTicket(id) de api/tickets.js.
//  2. Mostrar: código, título, descripción, ubicación, categoría, departamento, solicitante,
//     responsable, prioridad, estado, solución (si existe), fechas y datos_especificos (clave/valor).
//  3. Mostrar <Historial historial={...} /> y <Comentarios comentarios={...} />.
//  4. Acciones (mostrar SOLO si corresponde, usando utils/permisos.js):
//       puedeAsignar          -> elegir responsable (listarUsuarios con rol=responsable y el
//                                departamento del ticket) y llamar asignarTicket
//       puedeIniciarAtencion  -> cambiarEstado(id, { estado: 'en_proceso' })
//       puedeResolver         -> pedir la SOLUCIÓN (obligatoria) y cambiarEstado(id, { estado: 'resuelto', solucion })
//       puedeCerrar           -> cambiarEstado(id, { estado: 'cerrado' })
//  5. Después de cada acción, refrescar el ticket con la respuesta de la API (devuelve el ticket actualizado).
//  6. Mostrar el mensaje de error de la API si algo falla (409 = alguien más lo modificó o transición inválida).
export default function TicketDetalle() {
  return (
    <div>
      <h1>Detalle del ticket</h1>
      <p>Pendiente de implementar</p>
    </div>
  );
}
