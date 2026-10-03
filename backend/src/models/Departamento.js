const mongoose = require('mongoose');
const { ESTADOS_REGISTRO } = require('../config/constants');

const departamentoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre del departamento es obligatorio'], trim: true, unique: true },
    descripcion: { type: String, trim: true, default: '' },
    estado: { type: String, enum: ESTADOS_REGISTRO, default: 'activo' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Departamento', departamentoSchema);
