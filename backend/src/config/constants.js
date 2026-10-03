// Valores permitidos del sistema. Todo en minúsculas (con guion bajo) para evitar inconsistencias.
const ROLES = {
  SOLICITANTE: 'solicitante',
  RESPONSABLE: 'responsable',
  ADMINISTRADOR: 'administrador',
};

const ESTADOS_REGISTRO = ['activo', 'inactivo']; // usuarios, departamentos y categorías

const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];

const ESTADOS_TICKET = ['pendiente', 'asignado', 'en_proceso', 'resuelto', 'cerrado'];

// Estados en los que un ticket se considera "abierto" (sirve para detectar duplicados, R5)
const ESTADOS_ABIERTOS = ['pendiente', 'asignado', 'en_proceso'];

module.exports = { ROLES, ESTADOS_REGISTRO, PRIORIDADES, ESTADOS_TICKET, ESTADOS_ABIERTOS };
