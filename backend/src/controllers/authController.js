const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { esTexto } = require('../utils/validar');

// POST /api/auth/login  { usuario, password }  ->  { token, usuario }
exports.login = asyncHandler(async (req, res) => {
  const { usuario, password } = req.body;
  // typeof string: evita inyecciones tipo {"usuario": {"$gt": ""}}
  if (!esTexto(usuario) || !esTexto(password)) throw new AppError('Usuario y contraseña son obligatorios', 400);

  const user = await Usuario.findOne({ usuario: usuario.toLowerCase().trim() })
    .select('+password')
    .populate('departamento_id', 'nombre');

  if (!user || !(await user.compararPassword(password))) {
    throw new AppError('Usuario o contraseña incorrectos', 401);
  }
  if (user.estado !== 'activo') throw new AppError('Tu usuario está inactivo. Contacta al administrador', 403); // RN-03

  const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  res.json({ token, usuario: user });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  await req.user.populate('departamento_id', 'nombre');
  res.json(req.user);
});
