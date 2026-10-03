const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// RNF2: ninguna ruta interna es accesible sin token válido.
// Se consulta el usuario en la BD en cada petición para que un usuario desactivado pierda acceso de inmediato (RN-03).
const autenticar = asyncHandler(async (req, res, next) => {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) throw new AppError('Debes iniciar sesión (falta el token)', 401);

  const payload = jwt.verify(token, process.env.JWT_SECRET); // si falla, errorHandler responde 401
  const usuario = await Usuario.findById(payload.id);
  if (!usuario || usuario.estado !== 'activo') throw new AppError('Usuario inexistente o inactivo', 401);

  req.user = usuario;
  next();
});

module.exports = { autenticar };
