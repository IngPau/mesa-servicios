// Convierte una fecha ISO del backend a texto legible (hora de Guatemala)
export function formatearFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-GT');
}
