// Reportes e indicadores (R6): totales, tiempos promedio y exportación.
//
// Cómo funciona (para la defensa):
//  - Se arma un filtro con los parámetros (fechas, departamento, categoría, prioridad).
//  - Se leen los tickets que cumplen el filtro SIN comentarios (solo los campos que hacen falta)
//    y los cálculos se hacen en JavaScript. Para el volumen de un hospital (miles de tickets)
//    responde en menos de 5 segundos (RNF1) y el código es fácil de leer y de explicar.
//  - Los tiempos salen de las fechas que ya se guardan: fecha_creacion, el historial
//    (asignación y paso a "en_proceso") y fecha_resolucion.
const Ticket = require('../models/Ticket');
const AppError = require('../utils/AppError');
const { esTexto, exigirObjectId } = require('../utils/validar');
const { PRIORIDADES, ESTADOS_TICKET, ESTADOS_ABIERTOS } = require('../config/constants');

const HORA = 1000 * 60 * 60;
const MAX_DIAS_GRAFICA = 92;

function fechaFiltro(valor, nombre, finDelDia) {
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const d = new Date(soloFecha ? `${valor}T${finDelDia ? '23:59:59.999' : '00:00:00.000'}Z` : valor);
  if (Number.isNaN(d.getTime())) throw new AppError(`"${nombre}" no es una fecha válida (usa AAAA-MM-DD)`, 400);
  return d;
}

// Convierte los parámetros de la URL en un filtro de MongoDB
function construirFiltro(q = {}) {
  const filtro = {};
  if (esTexto(q.departamento_id)) filtro.departamento_id = exigirObjectId(q.departamento_id, 'departamento_id');
  if (esTexto(q.categoria_id)) filtro.categoria_id = exigirObjectId(q.categoria_id, 'categoria_id');
  if (esTexto(q.prioridad)) {
    if (!PRIORIDADES.includes(q.prioridad)) throw new AppError(`Prioridad no válida (${PRIORIDADES.join(', ')})`, 400);
    filtro.prioridad = q.prioridad;
  }
  if (esTexto(q.desde) || esTexto(q.hasta)) {
    filtro.fecha_creacion = {};
    if (esTexto(q.desde)) filtro.fecha_creacion.$gte = fechaFiltro(q.desde, 'desde', false);
    if (esTexto(q.hasta)) filtro.fecha_creacion.$lte = fechaFiltro(q.hasta, 'hasta', true);
    if (filtro.fecha_creacion.$gte && filtro.fecha_creacion.$lte && filtro.fecha_creacion.$gte > filtro.fecha_creacion.$lte) {
      throw new AppError('La fecha "desde" no puede ser mayor que "hasta"', 400);
    }
  }
  return filtro;
}

async function leerTickets(filtro) {
  return Ticket.find(filtro)
    .select('codigo titulo ubicacion prioridad estado categoria_id departamento_id solicitante_id responsable_id fecha_creacion fecha_resolucion historial')
    .populate('categoria_id', 'nombre')
    .populate('departamento_id', 'nombre')
    .populate('solicitante_id', 'nombre')
    .populate('responsable_id', 'nombre')
    .sort({ fecha_creacion: 1 })
    .lean();
}

// Horas entre dos fechas (null si falta alguna)
const horasEntre = (a, b) => (a && b ? (new Date(b) - new Date(a)) / HORA : null);

// Tiempos de un ticket a partir de sus fechas e historial
function tiemposDe(t) {
  const asignacion = (t.historial || []).find((h) => h.accion === 'asignacion');
  const inicio = (t.historial || []).find((h) => h.accion === 'cambio_estado' && h.estado_nuevo === 'en_proceso');
  return {
    asignacion: horasEntre(t.fecha_creacion, asignacion && asignacion.fecha),
    atencion: horasEntre(asignacion && asignacion.fecha, inicio && inicio.fecha),
    resolucion: horasEntre(t.fecha_creacion, t.fecha_resolucion),
  };
}

// Promedio redondeado a 1 decimal (null si no hay datos)
function promedio(valores) {
  const v = valores.filter((x) => typeof x === 'number' && x >= 0);
  if (!v.length) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
}

const esResuelto = (t) => t.estado === 'resuelto' || t.estado === 'cerrado';

// Agrupa tickets por una clave y calcula totales y tiempo promedio de resolución
function agrupar(tickets, obtenerClave) {
  const grupos = new Map();
  for (const t of tickets) {
    const { id, nombre } = obtenerClave(t);
    if (!grupos.has(id)) grupos.set(id, { _id: id, nombre, total: 0, abiertos: 0, resueltos: 0, tiempos: [] });
    const g = grupos.get(id);
    g.total += 1;
    if (ESTADOS_ABIERTOS.includes(t.estado)) g.abiertos += 1;
    if (esResuelto(t)) { g.resueltos += 1; g.tiempos.push(tiemposDe(t).resolucion); }
  }
  return [...grupos.values()]
    .map(({ tiempos, ...g }) => ({ ...g, horas_promedio_resolucion: promedio(tiempos) }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
}

const ref = (doc, sinValor) => (doc ? { id: String(doc._id), nombre: doc.nombre } : { id: 'ninguno', nombre: sinValor });

// Clave AAAA-MM-DD en hora de Guatemala (UTC-6)
const diaLocal = (fecha) => new Date(new Date(fecha).getTime() - 6 * HORA).toISOString().slice(0, 10);

function serieDiaria(tickets, desde, hasta) {
  if (!tickets.length && !(desde && hasta)) return [];
  const soloFecha = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const inicio = soloFecha(desde) ? desde : desde ? diaLocal(desde) : diaLocal(tickets[0].fecha_creacion);
  const fin = soloFecha(hasta) ? hasta : hasta ? diaLocal(hasta) : diaLocal(new Date());
  const creados = {}, resueltos = {};
  for (const t of tickets) {
    const d = diaLocal(t.fecha_creacion); creados[d] = (creados[d] || 0) + 1;
    if (t.fecha_resolucion) { const r = diaLocal(t.fecha_resolucion); resueltos[r] = (resueltos[r] || 0) + 1; }
  }
  const dias = [];
  const cursor = new Date(`${inicio}T00:00:00Z`);
  const ultimo = new Date(`${fin}T00:00:00Z`);
  while (cursor <= ultimo) {
    const d = cursor.toISOString().slice(0, 10);
    dias.push({ fecha: d, creados: creados[d] || 0, resueltos: resueltos[d] || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dias.slice(-MAX_DIAS_GRAFICA); // la gráfica muestra como máximo los últimos 92 días del rango
}

async function resumen(query) {
  const filtro = construirFiltro(query);
  const tickets = await leerTickets(filtro);
  const tiempos = tickets.map(tiemposDe);

  const porEstado = Object.fromEntries(ESTADOS_TICKET.map((e) => [e, 0]));
  const porPrioridad = Object.fromEntries(PRIORIDADES.map((p) => [p, 0]));
  tickets.forEach((t) => { porEstado[t.estado] += 1; porPrioridad[t.prioridad] += 1; });

  const abiertos = tickets.filter((t) => ESTADOS_ABIERTOS.includes(t.estado));
  const ahora = Date.now();

  return {
    generado: new Date(),
    filtros: { desde: query.desde || null, hasta: query.hasta || null, departamento_id: query.departamento_id || null, categoria_id: query.categoria_id || null, prioridad: query.prioridad || null },
    totales: {
      total: tickets.length,
      abiertos: abiertos.length,
      resueltos: tickets.filter(esResuelto).length,
      cerrados: porEstado.cerrado,
      criticos_abiertos: abiertos.filter((t) => t.prioridad === 'critica').length,
    },
    tiempos_promedio_horas: {
      asignacion: promedio(tiempos.map((x) => x.asignacion)),
      inicio_atencion: promedio(tiempos.map((x) => x.atencion)),
      resolucion: promedio(tiempos.map((x) => x.resolucion)),
    },
    por_estado: porEstado,
    por_prioridad: porPrioridad,
    por_categoria: agrupar(tickets, (t) => ref(t.categoria_id, 'Sin categoría')),
    por_departamento: agrupar(tickets, (t) => ref(t.departamento_id, 'Sin departamento')),
    por_responsable: agrupar(tickets.filter((t) => t.responsable_id), (t) => ref(t.responsable_id, 'Sin asignar')),
    por_dia: serieDiaria(tickets, query.desde || null, query.hasta || null),
    abiertos_mas_antiguos: abiertos
      .slice() // ya vienen ordenados del más antiguo al más reciente
      .slice(0, 5)
      .map((t) => ({
        _id: t._id, codigo: t.codigo, titulo: t.titulo, estado: t.estado, prioridad: t.prioridad,
        departamento: t.departamento_id ? t.departamento_id.nombre : '',
        fecha_creacion: t.fecha_creacion,
        dias_abierto: Math.floor((ahora - new Date(t.fecha_creacion)) / (24 * HORA)),
      })),
  };
}

// ---------- exportación a CSV (se abre en Excel) ----------
const celda = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const ETIQUETA_ESTADO = { pendiente: 'Pendiente', asignado: 'Asignado', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' };
const ETIQUETA_PRIORIDAD = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' };
const fechaTexto = (f) => (f ? new Date(new Date(f).getTime() - 6 * HORA).toISOString().replace('T', ' ').slice(0, 16) : '');

async function exportarCSV(query) {
  const tickets = await leerTickets(construirFiltro(query));
  const encabezado = ['Código', 'Título', 'Categoría', 'Departamento', 'Solicitante', 'Responsable', 'Prioridad', 'Estado', 'Ubicación',
    'Fecha de creación', 'Fecha de resolución', 'Horas hasta asignar', 'Horas hasta resolver'];
  const filas = tickets.map((t) => {
    const x = tiemposDe(t);
    const h = (n) => (n === null ? '' : n.toFixed(1));
    return [t.codigo, t.titulo, t.categoria_id && t.categoria_id.nombre, t.departamento_id && t.departamento_id.nombre,
      t.solicitante_id && t.solicitante_id.nombre, t.responsable_id ? t.responsable_id.nombre : 'Sin asignar',
      ETIQUETA_PRIORIDAD[t.prioridad] || t.prioridad, ETIQUETA_ESTADO[t.estado] || t.estado, t.ubicacion, fechaTexto(t.fecha_creacion), fechaTexto(t.fecha_resolucion), h(x.asignacion), h(x.resolucion)];
  });
  // "﻿" (BOM) para que Excel reconozca las tildes y la ñ
  return '﻿' + [encabezado, ...filas].map((f) => f.map(celda).join(',')).join('\r\n');
}

module.exports = { resumen, exportarCSV, construirFiltro };
