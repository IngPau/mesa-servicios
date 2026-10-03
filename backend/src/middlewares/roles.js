const AppError = require('../utils/AppError');

// Uso: permitir('administrador', 'responsable') -> solo esos roles pasan
const permitir = (...rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.user.rol)) {
    return next(new AppError('No tienes permiso para realizar esta acción', 403));
  }
  next();
};

module.exports = { permitir };
