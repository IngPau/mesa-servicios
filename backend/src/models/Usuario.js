const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ESTADOS_REGISTRO } = require('../config/constants');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    usuario: {
      type: String,
      required: [true, 'El usuario es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select:false -> la contraseña (hash) nunca sale en las consultas a menos que se pida explícitamente
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false,
    },
    rol: {
      type: String,
      enum: { values: Object.values(ROLES), message: 'Rol no válido (solicitante, responsable o administrador)' },
      required: [true, 'El rol es obligatorio'],
    },
    departamento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Departamento', default: null },
    estado: { type: String, enum: ESTADOS_REGISTRO, default: 'activo' },
  },
  { timestamps: true, versionKey: false }
);

// RN-02: solicitantes y responsables pertenecen a un departamento; el administrador puede no tener
usuarioSchema.pre('validate', function () {
  const requiereDepto = this.rol === ROLES.SOLICITANTE || this.rol === ROLES.RESPONSABLE;
  if (requiereDepto && !this.departamento_id) {
    this.invalidate('departamento_id', 'Los solicitantes y responsables deben pertenecer a un departamento');
  }
});

// RNF2: la contraseña se guarda cifrada (bcrypt), nunca en texto plano
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

usuarioSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
