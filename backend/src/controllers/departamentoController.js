const Departamento = require('../models/Departamento');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { exigirObjectId, esTexto } = require('../utils/validar');

// GET /api/departamentos  (los no administradores solo ven los activos)
exports.listar = asyncHandler(async (req, res) => {
  const filtro = {};
  if (req.user.rol !== 'administrador') filtro.estado = 'activo';
  else if (esTexto(req.query.estado)) filtro.estado = req.query.estado;
  res.json(await Departamento.find(filtro).sort({ nombre: 1 }));
});

exports.obtener = asyncHandler(async (req, res) => {
  const dep = await Departamento.findById(exigirObjectId(req.params.id));
  if (!dep) throw new AppError('Departamento no encontrado', 404);
  res.json(dep);
});

exports.crear = asyncHandler(async (req, res) => {
  const { nombre, descripcion } = req.body;
  const dep = await Departamento.create({ nombre, descripcion });
  res.status(201).json(dep);
});

exports.actualizar = asyncHandler(async (req, res) => {
  const dep = await Departamento.findById(exigirObjectId(req.params.id));
  if (!dep) throw new AppError('Departamento no encontrado', 404);
  const { nombre, descripcion, estado } = req.body;
  if (nombre !== undefined) dep.nombre = nombre;
  if (descripcion !== undefined) dep.descripcion = descripcion;
  if (estado !== undefined) dep.estado = estado;
  await dep.save();
  res.json(dep);
});
