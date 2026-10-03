// Valores del sistema (deben coincidir con el backend: backend/src/config/constants.js)
export const ROLES = {
  SOLICITANTE: 'solicitante',
  RESPONSABLE: 'responsable',
  ADMINISTRADOR: 'administrador',
};

export const ESTADOS = ['pendiente', 'asignado', 'en_proceso', 'resuelto', 'cerrado'];
export const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];

// Textos para mostrar al usuario
export const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

export const ETIQUETAS_PRIORIDAD = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export const ETIQUETAS_ROL = {
  solicitante: 'Solicitante',
  responsable: 'Responsable',
  administrador: 'Administrador',
};

export const ETIQUETAS_ACCION_HISTORIAL = {
  creacion: 'Creación',
  asignacion: 'Asignación',
  cambio_estado: 'Cambio de estado',
};
