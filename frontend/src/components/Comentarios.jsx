// Lista de comentarios del ticket y cuadro para agregar uno nuevo.
// Los comentarios no se editan ni se borran, y se permiten incluso con el ticket cerrado.
// Uso: <Comentarios comentarios={ticket.comentarios} ticketId={ticket._id} onActualizar={setTicket} />
import './Comentarios.css';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { comentarTicket } from '../api/tickets';
import { mensajeDeError } from '../api/cliente';
import { ETIQUETAS_ROL } from '../utils/constantes';
import { formatearFecha } from '../utils/formato';

export default function Comentarios({ comentarios = [], ticketId, onActualizar }) {
  const { usuario } = useAuth();
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setError('');
    setEnviando(true);
    try {
      // La API devuelve el ticket completo actualizado
      const ticketActualizado = await comentarTicket(ticketId, mensaje.trim());
      setMensaje('');
      onActualizar(ticketActualizado);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="comentarios">
      {comentarios.length === 0 && <p className="vacio">Aún no hay comentarios. Escribe el primero.</p>}

      {comentarios.map((c) => (
        <article key={c._id} className={`comentario${c.usuario_id?._id === usuario._id ? ' comentario--propio' : ''}`}>
          <div className="comentario__cabecera">
            <span className="comentario__autor">{c.usuario_id?.nombre || 'Usuario'}</span>
            {c.usuario_id?.rol && (
              <span className="comentario__rol">{ETIQUETAS_ROL[c.usuario_id.rol] || c.usuario_id.rol}</span>
            )}
            <span className="comentario__fecha">{formatearFecha(c.fecha)}</span>
          </div>
          <p className="comentario__texto">{c.mensaje}</p>
        </article>
      ))}

      <form className="comentarios__form" onSubmit={enviar}>
        {error && <div className="aviso aviso--error" role="alert">{error}</div>}
        <label htmlFor="nuevo-comentario" className="ayuda">Agregar un comentario</label>
        <textarea id="nuevo-comentario" className="input" value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe tu comentario..." />
        <button type="submit" className="btn" disabled={enviando || !mensaje.trim()}>
          {enviando ? 'Enviando...' : 'Comentar'}
        </button>
      </form>
    </div>
  );
}