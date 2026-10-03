const AppError = require('./AppError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const esObjectId = (v) => typeof v === 'string' && OBJECT_ID.test(v);

const exigirObjectId = (v, nombre = 'id') => {
  if (!esObjectId(v)) throw new AppError(`${nombre} no es un identificador válido`, 400);
  return v;
};

const esTexto = (v) => typeof v === 'string' && v.trim().length > 0;

const esObjetoPlano = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Escapa caracteres especiales para usar texto del usuario dentro de una expresión regular
const escaparRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Evita claves peligrosas ("$..." o con ".") en objetos que se guardan tal cual en MongoDB
const clavesSeguras = (obj) =>
  Object.entries(obj).every(
    ([k, v]) => !k.startsWith('$') && !k.includes('.') && (!esObjetoPlano(v) || clavesSeguras(v))
  );

module.exports = { esObjectId, exigirObjectId, esTexto, esObjetoPlano, escaparRegex, clavesSeguras };
