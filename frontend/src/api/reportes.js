import cliente from './cliente';

// GET /reportes/resumen?desde=&hasta=&departamento_id=&categoria_id=&prioridad=   (solo administrador)
// -> { totales, tiempos_promedio_horas, por_estado, por_prioridad, por_categoria, por_departamento,
//      por_responsable, por_dia, abiertos_mas_antiguos }
export const obtenerResumen = (params = {}) => cliente.get('/reportes/resumen', { params }).then((r) => r.data);

// GET /reportes/exportar?...mismos filtros -> archivo CSV (Blob) para abrir en Excel
export const exportarReporte = (params = {}) =>
  cliente.get('/reportes/exportar', { params, responseType: 'blob' }).then((r) => r.data);
