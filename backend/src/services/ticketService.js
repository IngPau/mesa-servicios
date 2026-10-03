// Aquí viven las reglas de negocio de los tickets (RN-xx y R1-R5 de los requerimientos).
// Los controladores solo reciben la petición y llaman a estas funciones.
const Ticket = require('../models/Ticket');
const Categoria = require('../models/Categoria');
const Usuario = require('../models/Usuario');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const { exigirObjectId, esTexto, esObjetoPlano, escaparRegex, clavesSeguras } = require('../utils/validar');
const { ROLES, PRIORIDADES, ESTADOS_TICKET, ESTADOS_ABIERTOS } = require('../config/constants');

const FLUJO = 'pendiente → asignado → en_proceso → resuelto → cerrado';

// Quién puede hacer cada paso del flujo (RN-13, RN-14, RN-15). "pendiente → asignado" se hace con asignarResponsable().
const TRANSICIONES = {
  asignado: { siguiente: 'en_proceso', roles: [ROLES.RESPONSABLE, ROLES.ADMINISTRADOR] },
  en_proceso: { siguiente: 'resuelto', roles: [ROLES.RESPONSABLE, ROLES.ADMINISTRADOR] },
  resuelto: { siguiente: 'cerrado', roles: [ROLES.SOLICITANTE, ROLES.ADMINISTRADOR] },
};

const POBLAR_LISTA = [
  { path: 'categoria_id', select: 'nombre' },
  { path: 'departamento_id', select: 'nombre' },
  { path: 'solicitante_id', select: 'nombre usuario' },
  { path: 'responsable_id', select: 'nombre usuario' },
];
const POBLAR_DETALLE = [
  ...POBLAR_LISTA,
  { path: 'comentarios.usuario_id', select: 'nombre rol' },
  { path: 'historial.usuario_id', select: 'nombre rol' },
  { path: 'historial.responsable_id', select: 'nombre usuario' },
];

const igual = (a, b) => String(a) === String(b);

// ---------- funciones puras (fáciles de probar) ----------

// R3: valida que el cambio de estado respete el flujo. Si no, explica cuál es el flujo correcto.
function validarTransicion(estadoActual, estadoNuevo) {
  if (estadoActual === 'cerrado') {
    throw new AppError('El ticket está Cerrado y ya no admite cambios de estado (RN-18)', 409);
  }
  if (estadoActual === 'pendiente') {
    throw new AppError(
      'Un ticket Pendiente solo pasa a Asignado asignándole un responsable (PATCH /api/tickets/:id/asignar)',
      409
    );
  }
  const regla = TRANSICIONES[estadoActual];
  if (estadoNuevo !== regla.siguiente) {
    throw new AppError(
      `Transición no válida: ${estadoActual} → ${estadoNuevo}. Desde "${estadoActual}" solo se puede pasar a "${regla.siguiente}". Flujo correcto: ${FLUJO}`,
      409
    );
  }
  return regla;
}

// RN-04 / matriz de permisos: quién puede ver un ticket
function puedeVerTicket(user, ticket) {
  if (user.rol === ROLES.ADMINISTRADOR) return true;
  if (user.rol === ROLES.SOLICITANTE) return igual(ticket.solicitante_id, user._id);
  if (user.rol === ROLES.RESPONSABLE) return igual(ticket.departamento_id, user.departamento_id);
  return false;
}

// ---------- funciones auxiliares con base de datos ----------

async function siguienteCodigo() {
  const c = await Counter.findOneAndUpdate({ _id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `TK-${String(c.seq).padStart(6, '0')}`;
}

async function buscarTicket(idOCodigo) {
  let ticket = null;
  if (typeof idOCodigo === 'string' && /^TK-\d+$/i.test(idOCodigo)) {
    ticket = await Ticket.findOne({ codigo: idOCodigo.toUpperCase() });
  } else {
    exigirObjectId(idOCodigo, 'El id del ticket');
    ticket = await Ticket.findById(idOCodigo);
  }
  if (!ticket) throw new AppError('Ticket no encontrado', 404);
  return ticket;
}

// Busca el ticket y comprueba que el usuario pueda verlo (si no, responde 404 para no filtrar su existencia)
async function buscarTicketVisible(user, idOCodigo) {
  const ticket = await buscarTicket(idOCodigo);
  if (!puedeVerTicket(user, ticket)) throw new AppError('Ticket no encontrado', 404);
  return ticket;
}

function fechaFiltro(valor, nombre, finDelDia) {
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const d = new Date(soloFecha ? `${valor}T${finDelDia ? '23:59:59.999' : '00:00:00.000'}Z` : valor);
  if (Number.isNaN(d.getTime())) throw new AppError(`"${nombre}" no es una fecha válida (usa AAAA-MM-DD)`, 400);
  return d;
}

// ---------- operaciones principales ----------

// R5 / RN-19: tickets abiertos con la misma categoría y ubicación
async function buscarDuplicados({ categoria_id, ubicacion }) {
  exigirObjectId(categoria_id, 'categoria_id');
  if (!esTexto(ubicacion)) throw new AppError('La ubicación es obligatoria para verificar duplicados', 400);
  return Ticket.find({
    categoria_id,
    estado: { $in: ESTADOS_ABIERTOS },
    ubicacion: new RegExp(`^${escaparRegex(ubicacion.trim())}$`, 'i'),
  })
    .select('codigo titulo estado prioridad ubicacion fecha_creacion')
    .sort({ fecha_creacion: -1 })
    .limit(10)
    .lean();
}

// R1, RN-05, RN-06, RN-07 + R5
async function crearTicket(user, body) {
  const { titulo, descripcion, categoria_id, prioridad, ubicacion } = body;
  const forzar = body.forzar === true || body.forzar === 'true';

  // R1 (situación anormal 1): avisar qué campos faltan
  const faltantes = [];
  if (!esTexto(titulo)) faltantes.push('titulo');
  if (!esTexto(descripcion)) faltantes.push('descripcion');
  if (!esTexto(categoria_id)) faltantes.push('categoria_id');
  if (!esTexto(prioridad)) faltantes.push('prioridad');
  if (!esTexto(ubicacion)) faltantes.push('ubicacion');
  if (faltantes.length) {
    throw new AppError(`Faltan campos obligatorios: ${faltantes.join(', ')}`, 400, { campos_faltantes: faltantes });
  }
  if (!PRIORIDADES.includes(prioridad)) {
    throw new AppError(`Prioridad no válida. Valores permitidos: ${PRIORIDADES.join(', ')}`, 400);
  }
  exigirObjectId(categoria_id, 'categoria_id');

  // R1 (situación anormal 2): los datos específicos deben poder procesarse
  const datos = body.datos_especificos === undefined ? {} : body.datos_especificos;
  if (!esObjetoPlano(datos) || !clavesSeguras(datos)) {
    throw new AppError('Los datos específicos no pudieron procesarse: deben ser un objeto con claves válidas', 400);
  }

  const categoria = await Categoria.findById(categoria_id).populate('departamento_id');
  if (!categoria || categoria.estado !== 'activo') throw new AppError('La categoría no existe o está inactiva', 400);
  const depto = categoria.departamento_id;
  if (!depto || depto.estado !== 'activo') throw new AppError('El departamento de la categoría está inactivo', 400);

  // Campos específicos que la categoría marca como requeridos (formulario dinámico)
  const sinValor = categoria.campos_especificos
    .filter((c) => c.requerido && (datos[c.nombre] === undefined || datos[c.nombre] === null || String(datos[c.nombre]).trim() === ''))
    .map((c) => c.etiqueta || c.nombre);
  if (sinValor.length) {
    throw new AppError(`Faltan datos específicos obligatorios para esta categoría: ${sinValor.join(', ')}`, 400, {
      campos_faltantes: sinValor,
    });
  }

  // R5: advertir si ya existe una solicitud abierta igual; el usuario puede forzar si es un evento distinto
  if (!forzar) {
    const duplicados = await buscarDuplicados({ categoria_id, ubicacion });
    if (duplicados.length) {
      throw new AppError(
        'Ya existe una solicitud abierta para esta categoría y ubicación. Si es un evento distinto, reenvía la petición con "forzar": true',
        409,
        { posible_duplicado: true, duplicados }
      );
    }
  }

  const ticket = await Ticket.create({
    codigo: await siguienteCodigo(),
    titulo,
    descripcion,
    ubicacion,
    categoria_id: categoria._id,
    departamento_id: depto._id, // RN-07: sale de la categoría
    solicitante_id: user._id,
    departamento_solicitante_id: user.departamento_id || null,
    prioridad,
    estado: 'pendiente', // RN-06
    datos_especificos: datos,
    historial: [
      {
        accion: 'creacion',
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        usuario_id: user._id,
        detalle: forzar ? 'Ticket creado confirmando que no es un duplicado' : 'Ticket creado',
      },
    ],
  });

  return ticket.populate(POBLAR_DETALLE);
}

// R4: listado con filtros; lo que se ve depende del rol
async function listarTickets(user, query) {
  const filtro = {};

  if (user.rol === ROLES.SOLICITANTE) filtro.solicitante_id = user._id;
  if (user.rol === ROLES.RESPONSABLE) filtro.departamento_id = user.departamento_id;

  if (esTexto(query.codigo)) filtro.codigo = new RegExp(escaparRegex(query.codigo.trim()), 'i');
  if (esTexto(query.estado)) {
    if (!ESTADOS_TICKET.includes(query.estado)) throw new AppError(`Estado no válido: ${ESTADOS_TICKET.join(', ')}`, 400);
    filtro.estado = query.estado;
  }
  if (esTexto(query.prioridad)) {
    if (!PRIORIDADES.includes(query.prioridad)) throw new AppError(`Prioridad no válida: ${PRIORIDADES.join(', ')}`, 400);
    filtro.prioridad = query.prioridad;
  }
  if (esTexto(query.categoria_id)) filtro.categoria_id = exigirObjectId(query.categoria_id, 'categoria_id');
  if (esTexto(query.departamento_id) && user.rol !== ROLES.RESPONSABLE) {
    filtro.departamento_id = exigirObjectId(query.departamento_id, 'departamento_id');
  }
  // Bandeja de trabajo del responsable (R2): sus tickets asignados
  if (query.asignado_a_mi === 'true' && user.rol !== ROLES.SOLICITANTE) filtro.responsable_id = user._id;

  if (esTexto(query.desde) || esTexto(query.hasta)) {
    filtro.fecha_creacion = {};
    if (esTexto(query.desde)) filtro.fecha_creacion.$gte = fechaFiltro(query.desde, 'desde', false);
    if (esTexto(query.hasta)) filtro.fecha_creacion.$lte = fechaFiltro(query.hasta, 'hasta', true);
  }

  const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);
  const limite = Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), 100);

  const [total, tickets] = await Promise.all([
    Ticket.countDocuments(filtro),
    Ticket.find(filtro)
      .select('-comentarios -historial')
      .populate(POBLAR_LISTA)
      .sort({ fecha_creacion: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
  ]);

  const respuesta = { total, pagina, limite, paginas: Math.ceil(total / limite), tickets };
  if (total === 0) respuesta.mensaje = 'No se encontraron solicitudes con los criterios indicados';
  return respuesta;
}

async function obtenerTicket(user, idOCodigo) {
  const ticket = await buscarTicketVisible(user, idOCodigo);
  return ticket.populate(POBLAR_DETALLE);
}

// R2, RN-08 a RN-12: el administrador asigna un responsable del mismo departamento
async function asignarResponsable(admin, idOCodigo, responsableId) {
  const ticket = await buscarTicket(idOCodigo);
  if (ticket.estado !== 'pendiente') {
    throw new AppError(`Solo se puede asignar un ticket Pendiente (estado actual: ${ticket.estado})`, 409);
  }
  exigirObjectId(responsableId, 'responsable_id');

  const responsable = await Usuario.findById(responsableId);
  if (!responsable || responsable.rol !== ROLES.RESPONSABLE) {
    throw new AppError('El usuario seleccionado debe existir y tener rol Responsable (RN-08)', 400);
  }
  if (responsable.estado !== 'activo') throw new AppError('El usuario seleccionado está inactivo', 400);
  if (!igual(responsable.departamento_id, ticket.departamento_id)) {
    throw new AppError('El responsable no pertenece al departamento destino del ticket (RN-09)', 400);
  }

  // Actualización atómica: solo se aplica si el ticket sigue Pendiente (evita doble asignación simultánea)
  const actualizado = await Ticket.findOneAndUpdate(
    { _id: ticket._id, estado: 'pendiente' },
    {
      $set: { responsable_id: responsable._id, estado: 'asignado' },
      $push: {
        historial: {
          accion: 'asignacion',
          estado_anterior: 'pendiente',
          estado_nuevo: 'asignado',
          usuario_id: admin._id,
          responsable_id: responsable._id,
          detalle: `Asignado a ${responsable.nombre} (${responsable.usuario})`,
          fecha: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!actualizado) throw new AppError('Otro usuario modificó el ticket al mismo tiempo. Recarga e intenta de nuevo', 409);
  return actualizado.populate(POBLAR_DETALLE);
}

// R3, RN-13, RN-14, RN-15, RN-17, RN-18: avanzar el estado y registrar el historial
async function cambiarEstado(user, idOCodigo, { estado, solucion, comentario }) {
  const ticket = await buscarTicketVisible(user, idOCodigo);

  if (!esTexto(estado) || !ESTADOS_TICKET.includes(estado)) {
    throw new AppError(`Debes indicar el nuevo estado. Valores: ${ESTADOS_TICKET.join(', ')}`, 400);
  }

  const regla = validarTransicion(ticket.estado, estado);

  if (!regla.roles.includes(user.rol)) {
    throw new AppError(`Tu rol (${user.rol}) no puede cambiar el ticket de "${ticket.estado}" a "${estado}"`, 403);
  }
  if (user.rol === ROLES.RESPONSABLE && !igual(ticket.responsable_id, user._id)) {
    throw new AppError('Solo el responsable asignado puede cambiar el estado de este ticket', 403);
  }
  if (user.rol === ROLES.SOLICITANTE && !igual(ticket.solicitante_id, user._id)) {
    throw new AppError('Solo puedes cerrar tus propios tickets', 403);
  }

  const set = { estado };
  if (estado === 'resuelto') {
    // RN-14: la solución es obligatoria para resolver
    if (!esTexto(solucion)) throw new AppError('Debes registrar la solución para marcar el ticket como Resuelto', 400);
    set.solucion = solucion.trim();
    set.fecha_resolucion = new Date();
  }

  const ahora = new Date();
  const notas = esTexto(comentario) ? comentario.trim() : null;
  const push = {
    historial: {
      accion: 'cambio_estado',
      estado_anterior: ticket.estado,
      estado_nuevo: estado,
      usuario_id: user._id,
      detalle: set.solucion || notas || '',
      fecha: ahora,
    },
  };
  if (notas) push.comentarios = { usuario_id: user._id, mensaje: notas, fecha: ahora };

  // Atómico: solo se aplica si el ticket sigue en el estado que leímos (concurrencia)
  const actualizado = await Ticket.findOneAndUpdate(
    { _id: ticket._id, estado: ticket.estado },
    { $set: set, $push: push },
    { new: true }
  );
  if (!actualizado) throw new AppError('Otro usuario modificó el ticket al mismo tiempo. Recarga e intenta de nuevo', 409);
  return actualizado.populate(POBLAR_DETALLE);
}

// RN-16: comentarios de usuarios relacionados con el ticket (se permiten también en tickets cerrados)
async function agregarComentario(user, idOCodigo, mensaje) {
  const ticket = await buscarTicketVisible(user, idOCodigo);
  if (!esTexto(mensaje)) throw new AppError('El mensaje del comentario es obligatorio', 400);
  if (mensaje.length > 2000) throw new AppError('El comentario no puede superar los 2000 caracteres', 400);

  const actualizado = await Ticket.findByIdAndUpdate(
    ticket._id,
    { $push: { comentarios: { usuario_id: user._id, mensaje: mensaje.trim(), fecha: new Date() } } },
    { new: true }
  );
  return actualizado.populate(POBLAR_DETALLE);
}

module.exports = {
  validarTransicion,
  puedeVerTicket,
  buscarDuplicados,
  crearTicket,
  listarTickets,
  obtenerTicket,
  asignarResponsable,
  cambiarEstado,
  agregarComentario,
};
