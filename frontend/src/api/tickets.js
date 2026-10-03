import cliente from './cliente';

// GET /tickets?estado=&prioridad=&codigo=&categoria_id=&departamento_id=&desde=&hasta=&asignado_a_mi=true&pagina=&limite=
// -> { total, pagina, limite, paginas, tickets, mensaje? }
export const listarTickets = (params = {}) => cliente.get('/tickets', { params }).then((r) => r.data);

// GET /tickets/:id  (acepta _id o código TK-000001) -> ticket con comentarios e historial
export const obtenerTicket = (id) => cliente.get(`/tickets/${id}`).then((r) => r.data);

// GET /tickets/duplicados?categoria_id=&ubicacion= -> { hay_duplicados, duplicados }
export const verificarDuplicados = (params) => cliente.get('/tickets/duplicados', { params }).then((r) => r.data);

// POST /tickets  { titulo, descripcion, categoria_id, prioridad, ubicacion, datos_especificos?, forzar? }
// Puede responder 409 con { posible_duplicado: true, duplicados: [...] } (usar datosDeError)
export const crearTicket = (datos) => cliente.post('/tickets', datos).then((r) => r.data);

// PATCH /tickets/:id/asignar  { responsable_id }   (solo administrador)
export const asignarTicket = (id, responsable_id) =>
  cliente.patch(`/tickets/${id}/asignar`, { responsable_id }).then((r) => r.data);

// PATCH /tickets/:id/estado  { estado, solucion?, comentario? }
// estado: en_proceso | resuelto | cerrado   (solucion es obligatoria al resolver)
export const cambiarEstado = (id, datos) => cliente.patch(`/tickets/${id}/estado`, datos).then((r) => r.data);

// POST /tickets/:id/comentarios  { mensaje } -> ticket completo actualizado
export const comentarTicket = (id, mensaje) =>
  cliente.post(`/tickets/${id}/comentarios`, { mensaje }).then((r) => r.data);
