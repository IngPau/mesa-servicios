const mongoose = require('mongoose');

// Contador atómico para generar códigos consecutivos (TK-000001, TK-000002, ...)
const counterSchema = new mongoose.Schema(
  { _id: { type: String }, seq: { type: Number, default: 0 } },
  { versionKey: false }
);

module.exports = mongoose.model('Counter', counterSchema);
