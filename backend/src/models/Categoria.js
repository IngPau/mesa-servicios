const mongoose = require('mongoose');
const { ESTADOS_REGISTRO } = require('../config/constants');

// Define qué datos adicionales pide el formulario para esta categoría (formulario dinámico, R1 / RNF4)
const campoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'Cada campo específico necesita un nombre'], trim: true },
    etiqueta: { type: String, trim: true },
    requerido: { type: Boolean, default: false },
  },
  { _id: false }
);

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre de la categoría es obligatorio'], trim: true },
    descripcion: { type: String, trim: true, default: '' },
    // La categoría determina el departamento encargado (RN-07)
    departamento_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Departamento',
      required: [true, 'El departamento de la categoría es obligatorio'],
    },
    campos_especificos: { type: [campoSchema], default: [] },
    estado: { type: String, enum: ESTADOS_REGISTRO, default: 'activo' },
  },
  { timestamps: true, versionKey: false }
);

categoriaSchema.index({ nombre: 1, departamento_id: 1 }, { unique: true });

module.exports = mongoose.model('Categoria', categoriaSchema);
