const service = require('../services/ticketService');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/tickets/duplicados?categoria_id=&ubicacion=   (R5: consulta previa a crear)
exports.duplicados = asyncHandler(async (req, res) => {
  const duplicados = await service.buscarDuplicados(req.query);
  res.json({ hay_duplicados: duplicados.length > 0, duplicados });
});

// POST /api/tickets   (R1)
exports.crear = asyncHandler(async (req, res) => {
  res.status(201).json(await service.crearTicket(req.user, req.body));
});

// GET /api/tickets   (R4)
exports.listar = asyncHandler(async (req, res) => {
  res.json(await service.listarTickets(req.user, req.query));
});

// GET /api/tickets/:id   (id interno o código, ej. TK-000001)
exports.obtener = asyncHandler(async (req, res) => {
  res.json(await service.obtenerTicket(req.user, req.params.id));
});

// PATCH /api/tickets/:id/asignar   { responsable_id }   (R2)
exports.asignar = asyncHandler(async (req, res) => {
  res.json(await service.asignarResponsable(req.user, req.params.id, req.body.responsable_id));
});

// PATCH /api/tickets/:id/estado   { estado, solucion?, comentario? }   (R3)
exports.cambiarEstado = asyncHandler(async (req, res) => {
  res.json(await service.cambiarEstado(req.user, req.params.id, req.body));
});

// POST /api/tickets/:id/comentarios   { mensaje }
exports.comentar = asyncHandler(async (req, res) => {
  res.status(201).json(await service.agregarComentario(req.user, req.params.id, req.body.mensaje));
});
