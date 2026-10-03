// Formulario para crear un ticket (solicitante y administrador).   Módulo asignado a: ________
//
// TODO:
//  1. Cargar categorías con listarCategorias() de api/categorias.js.
//  2. Campos: título, descripción, categoría, prioridad (PRIORIDADES), ubicación.
//  3. FORMULARIO DINÁMICO: al elegir una categoría, generar un input por cada elemento de
//     categoria.campos_especificos (usar "etiqueta" como texto y "requerido" para validar).
//     Lo capturado se envía en datos_especificos usando "nombre" como clave.
//     Mostrar el departamento destino de la categoría (solo informativo).
//  4. DUPLICADOS: crearTicket puede responder 409 con posible_duplicado: true y la lista "duplicados"
//     (usar datosDeError de api/cliente.js). Mostrar los tickets similares y ofrecer
//       - Cancelar (ya existe), o
//       - "Es un evento distinto": reenviar la misma petición con forzar: true.
//     Opcional: consultar verificarDuplicados() antes de enviar.
//  5. Si faltan campos, la API responde 400 con "campos_faltantes": resaltarlos.
//  6. Al crear con éxito (201), mostrar el código generado y redirigir a /tickets/:id.
export default function NuevoTicket() {
  return (
    <div>
      <h1>Nuevo ticket</h1>
      <p>Pendiente de implementar</p>
    </div>
  );
}
