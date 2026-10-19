const asyncHandler = require('../utils/asyncHandler');
const reporteService = require('../services/reporteService');

// GET /api/reportes/resumen?desde=&hasta=&departamento_id=&categoria_id=&prioridad=
exports.resumen = asyncHandler(async (req, res) => {
  res.json(await reporteService.resumen(req.query));
});

// GET /api/reportes/exportar?...mismos filtros  -> archivo CSV
exports.exportar = asyncHandler(async (req, res) => {
  const csv = await reporteService.exportarCSV(req.query);
  const hoy = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-solicitudes-${hoy}.csv"`);
  res.send(csv);
});
