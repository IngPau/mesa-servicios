// Listado y búsqueda de tickets.   Módulo asignado a: ________
//
// TODO:
//  1. Cargar los tickets con listarTickets(params) de api/tickets.js (la API ya filtra según el rol:
//     el solicitante ve solo los suyos, el responsable los de su departamento, el admin todos).
//  2. Filtros: código, estado (ESTADOS), prioridad (PRIORIDADES), rango de fechas (desde/hasta),
//     y departamento (solo administrador; cargar con listarDepartamentos).
//  3. Para el responsable: opción "Asignados a mí" (parámetro asignado_a_mi=true).
//  4. Paginación con pagina/limite (la respuesta trae total, paginas).
//  5. Si total es 0, mostrar el campo "mensaje" de la respuesta.
//  6. Cada fila: código, título, <BadgeEstado />, <BadgePrioridad />, categoría, fecha, y enlace a /tickets/:id
//  7. Manejar estados de carga y errores (mensajeDeError).
export default function Tickets() {
  return (
    <div>
      <h1>Tickets</h1>
      <p>Pendiente de implementar</p>
    </div>
  );
}
