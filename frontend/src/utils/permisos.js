// Qué botones/acciones se muestran según el rol, el estado del ticket y quién es el usuario.
// El backend igual valida todo (devuelve 403), esto solo evita mostrar acciones que no corresponden.
// "usuario" es el objeto de sesión (useAuth) y "ticket" es el objeto que devuelve GET /tickets/:id
import { ROLES } from './constantes';

const esAdmin = (u) => u?.rol === ROLES.ADMINISTRADOR;

const esResponsableAsignado = (u, t) =>
  u?.rol === ROLES.RESPONSABLE && t?.responsable_id?._id === u._id;

export const puedeCrearTicket = (u) => u?.rol === ROLES.SOLICITANTE || esAdmin(u);

export const puedeAsignar = (u, t) => esAdmin(u) && t?.estado === 'pendiente';

export const puedeIniciarAtencion = (u, t) =>
  t?.estado === 'asignado' && (esAdmin(u) || esResponsableAsignado(u, t));

export const puedeResolver = (u, t) =>
  t?.estado === 'en_proceso' && (esAdmin(u) || esResponsableAsignado(u, t));

export const puedeCerrar = (u, t) =>
  t?.estado === 'resuelto' &&
  (esAdmin(u) || (u?.rol === ROLES.SOLICITANTE && t?.solicitante_id?._id === u._id));
