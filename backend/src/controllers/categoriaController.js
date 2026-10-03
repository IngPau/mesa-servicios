const Categoria = require('../models/Categoria');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { exigirObjectId, esTexto } = require('../utils/validar');
const { validarDepartamentoActivo } = require('../utils/catalogos');

// GET /api/categorias?departamento_id=  (los no administradores solo ven las activas)
exports.listar = asyncHandler(async (req, res) => {
  const filtro = {};
  if (req.user.rol !== 'administrador') filtro.estado = 'activo';
  else if (esTexto(req.query.estado)) filtro.estado = req.query.estado;
  if (esTexto(req.query.departamento_id)) filtro.departamento_id = exigirObjectId(req.query.departamento_id, 'departamento_id');

  res.json(await Categoria.find(filtro).populate('departamento_id', 'nombre').sort({ nombre: 1 }));
});

exports.obtener = asyncHandler(async (req, res) => {
  const cat = await Categoria.findById(exigirObjectId(req.params.id)).populate('departamento_id', 'nombre');
  if (!cat) throw new AppError('Categoría no encontrada', 404);
  res.json(cat);
});

exports.crear = asyncHandler(async (req, res) => {
  const { nombre, descripcion, departamento_id, campos_especificos } = req.body;
  await validarDepartamentoActivo(departamento_id);
  const cat = await Categoria.create({ nombre, descripcion, departamento_id, campos_especificos });
  res.status(201).json(cat);
});

exports.actualizar = asyncHandler(async (req, res) => {
  const cat = await Categoria.findById(exigirObjectId(req.params.id));
  if (!cat) throw new AppError('Categoría no encontrada', 404);
  const { nombre, descripcion, departamento_id, campos_especificos, estado } = req.body;
  if (nombre !== undefined) cat.nombre = nombre;
  if (descripcion !== undefined) cat.descripcion = descripcion;
  if (estado !== undefined) cat.estado = estado;
  if (campos_especificos !== undefined) cat.campos_especificos = campos_especificos;
  if (departamento_id !== undefined) {
    await validarDepartamentoActivo(departamento_id);
    cat.departamento_id = departamento_id; // los tickets ya creados conservan su departamento
  }
  await cat.save();
  res.json(cat);
});
