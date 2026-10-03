const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { exigirObjectId, esTexto } = require('../utils/validar');
const { validarDepartamentoActivo } = require('../utils/catalogos');

// GET /api/usuarios?rol=&estado=&departamento_id=
exports.listar = asyncHandler(async (req, res) => {
  const filtro = {};
  if (esTexto(req.query.rol)) filtro.rol = req.query.rol;
  if (esTexto(req.query.estado)) filtro.estado = req.query.estado;
  if (esTexto(req.query.departamento_id)) filtro.departamento_id = exigirObjectId(req.query.departamento_id, 'departamento_id');

  const usuarios = await Usuario.find(filtro).populate('departamento_id', 'nombre').sort({ nombre: 1 });
  res.json(usuarios);
});

exports.obtener = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findById(exigirObjectId(req.params.id)).populate('departamento_id', 'nombre');
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  res.json(usuario);
});

// POST /api/usuarios  (R7)
exports.crear = asyncHandler(async (req, res) => {
  const { nombre, usuario, password, rol, departamento_id } = req.body;
  if (![nombre, usuario, password, rol].every(esTexto)) {
    throw new AppError('nombre, usuario, password y rol son obligatorios', 400);
  }
  if (departamento_id) await validarDepartamentoActivo(departamento_id);

  const nuevo = new Usuario({ nombre, usuario, password, rol, departamento_id: departamento_id || null });
  await nuevo.save(); // si el usuario ya existe -> error 409 (duplicidad de credencial)
  res.status(201).json(nuevo);
});

// PATCH /api/usuarios/:id  (editar, cambiar rol, activar/desactivar, cambiar contraseña)
exports.actualizar = asyncHandler(async (req, res) => {
  const u = await Usuario.findById(exigirObjectId(req.params.id));
  if (!u) throw new AppError('Usuario no encontrado', 404);

  const { nombre, rol, departamento_id, password, estado } = req.body;

  // Evita que el administrador se bloquee a sí mismo
  if (u._id.equals(req.user._id) && ((estado && estado !== 'activo') || (rol && rol !== u.rol))) {
    throw new AppError('No puedes desactivarte ni cambiarte el rol a ti mismo', 400);
  }

  if (nombre !== undefined) u.nombre = nombre;
  if (rol !== undefined) u.rol = rol;
  if (estado !== undefined) u.estado = estado;
  if (departamento_id !== undefined) {
    if (departamento_id === null || departamento_id === '') {
      u.departamento_id = null;
    } else {
      await validarDepartamentoActivo(departamento_id);
      u.departamento_id = departamento_id;
    }
  }
  if (password !== undefined) {
    if (!esTexto(password)) throw new AppError('La contraseña no es válida', 400);
    u.password = password;
  }

  await u.save();
  res.json(u);
});
