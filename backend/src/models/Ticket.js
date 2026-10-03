const mongoose = require('mongoose');
const { PRIORIDADES, ESTADOS_TICKET } = require('../config/constants');

const { ObjectId } = mongoose.Schema.Types;

// Comentarios embebidos dentro del ticket (nunca se eliminan, RN-16)
const comentarioSchema = new mongoose.Schema({
  usuario_id: { type: ObjectId, ref: 'Usuario', required: true },
  mensaje: { type: String, required: true, trim: true },
  fecha: { type: Date, default: Date.now },
});

// Historial embebido: qué pasó, quién lo hizo y cuándo (RN-17, R3)
const historialSchema = new mongoose.Schema(
  {
    accion: { type: String, required: true }, // creacion | asignacion | cambio_estado
    estado_anterior: { type: String, default: null },
    estado_nuevo: { type: String, required: true },
    usuario_id: { type: ObjectId, ref: 'Usuario', required: true },
    responsable_id: { type: ObjectId, ref: 'Usuario', default: null }, // quién recibió la asignación
    detalle: { type: String, default: '' },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true },
    titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 150 },
    descripcion: { type: String, required: [true, 'La descripción es obligatoria'], trim: true },
    ubicacion: { type: String, required: [true, 'La ubicación es obligatoria'], trim: true },
    categoria_id: { type: ObjectId, ref: 'Categoria', required: true },
    departamento_id: { type: ObjectId, ref: 'Departamento', required: true }, // departamento destino
    solicitante_id: { type: ObjectId, ref: 'Usuario', required: true },
    departamento_solicitante_id: { type: ObjectId, ref: 'Departamento', default: null },
    responsable_id: { type: ObjectId, ref: 'Usuario', default: null },
    prioridad: { type: String, enum: PRIORIDADES, required: [true, 'La prioridad es obligatoria'] },
    estado: { type: String, enum: ESTADOS_TICKET, default: 'pendiente' },
    // Datos que cambian según la categoría (esquema flexible, aquí brilla MongoDB)
    datos_especificos: { type: mongoose.Schema.Types.Mixed, default: {} },
    fecha_resolucion: { type: Date, default: null },
    solucion: { type: String, default: null },
    comentarios: { type: [comentarioSchema], default: [] },
    historial: { type: [historialSchema], default: [] },
  },
  {
    timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' },
    versionKey: false,
    minimize: false,
  }
);

// Índices para que las búsquedas y la detección de duplicados sean rápidas (RNF1)
ticketSchema.index({ categoria_id: 1, estado: 1 });
ticketSchema.index({ solicitante_id: 1, fecha_creacion: -1 });
ticketSchema.index({ departamento_id: 1, estado: 1 });
ticketSchema.index({ responsable_id: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
