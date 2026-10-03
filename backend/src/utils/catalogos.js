const Departamento = require('../models/Departamento');
const AppError = require('./AppError');
const { exigirObjectId } = require('./validar');

// Verifica que el departamento exista y esté activo; lo devuelve
async function validarDepartamentoActivo(id) {
  exigirObjectId(id, 'departamento_id');
  const dep = await Departamento.findById(id);
  if (!dep) throw new AppError('El departamento indicado no existe', 400);
  if (dep.estado !== 'activo') throw new AppError('El departamento indicado está inactivo', 400);
  return dep;
}

module.exports = { validarDepartamentoActivo };
