const AppError = require('../utils/AppError');

const noEncontrada = (req, res, next) => next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));

// Convierte cualquier error en una respuesta JSON uniforme: { error: true, mensaje, ... }
// eslint-disable-next-line no-unused-vars
const manejarErrores = (err, req, res, next) => {
  let status = err.status || 500;
  let mensaje = err.message;
  let extra = err.extra || {};

  if (err.name === 'ValidationError') {
    status = 400;
    const detalles = Object.values(err.errors).map((e) => e.message);
    mensaje = detalles.join('. ');
    extra = { detalles };
  } else if (err.name === 'CastError') {
    status = 400;
    mensaje = `Valor no válido para el campo "${err.path}"`;
  } else if (err.code === 11000) {
    status = 409;
    mensaje = `Ya existe un registro con el mismo valor en: ${Object.keys(err.keyValue || {}).join(', ')}`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    mensaje = 'Sesión no válida o expirada. Inicia sesión de nuevo';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  } else if (!(err instanceof AppError)) {
    console.error(err);
    status = 500;
    mensaje = 'Error interno del servidor';
    extra = {};
  }

  res.status(status).json({ error: true, mensaje, ...extra });
};

module.exports = { noEncontrada, manejarErrores };
