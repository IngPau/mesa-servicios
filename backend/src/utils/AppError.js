// Error "esperado" con código HTTP y mensaje claro para el usuario.
class AppError extends Error {
  constructor(mensaje, status = 400, extra = {}) {
    super(mensaje);
    this.status = status;
    this.extra = extra;
  }
}

module.exports = AppError;
