// Lista de comentarios de un ticket y cuadro para agregar uno nuevo.
// Uso: <Comentarios comentarios={ticket.comentarios} onAgregar={async (mensaje) => {...}} />
//
// TODO: mostrar autor (comentario.usuario_id.nombre), mensaje y fecha (formatearFecha);
//       formulario con el mensaje (obligatorio, máx. 2000 caracteres) que llame a onAgregar.
//       Los comentarios no se editan ni se borran. También se permiten en tickets cerrados.
//       La pantalla que lo use debe llamar a comentarTicket(id, mensaje) de api/tickets.js
export default function Comentarios({ comentarios = [] }) {
  return (
    <section>
      <h3>Comentarios</h3>
      <p>Pendiente de implementar ({comentarios.length} comentarios)</p>
    </section>
  );
}
