// Detalle de un ticket y acciones sobre él.   Módulo asignado a: ________
//
// Cómo funciona (para la defensa):
//  - El id sale de la URL (useParams) y se carga con obtenerTicket. La API acepta el _id o el código TK-000001.
//  - Los botones de acción se muestran solo si utils/permisos.js dice que el usuario puede usarlos
//    (el backend igualmente valida y responde 403/409 si no corresponde).
//  - Cada acción devuelve el ticket actualizado, que reemplaza al que está en pantalla.
//  - Un 409 suele significar que otra persona cambió el ticket: se muestra el mensaje y se recarga.
import './TicketDetalle.css';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerTicket, asignarTicket, cambiarEstado } from '../api/tickets';
import { listarUsuarios } from '../api/usuarios';
import { mensajeDeError } from '../api/cliente';
import { puedeAsignar, puedeIniciarAtencion, puedeResolver, puedeCerrar } from '../utils/permisos';
import { formatearFecha } from '../utils/formato';
import BadgeEstado from '../components/BadgeEstado';
import BadgePrioridad from '../components/BadgePrioridad';
import Historial from '../components/Historial';
import Comentarios from '../components/Comentarios';

// "numero_serie" -> "Numero serie"
function etiquetaDeClave(clave) {
  const texto = clave.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function TicketDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [responsables, setResponsables] = useState([]);
  const [responsableId, setResponsableId] = useState('');
  const [resolviendo, setResolviendo] = useState(false);
  const [solucion, setSolucion] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');

  // 1. Cargar el ticket
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    obtenerTicket(id)
      .then((t) => vigente && setTicket(t))
      .catch((err) => vigente && setError(mensajeDeError(err)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [id]);

  const mostrarAsignar = !!ticket && puedeAsignar(usuario, ticket);
  const departamentoId = ticket?.departamento_id?._id;

  // Responsables del mismo departamento del ticket (para el selector de asignar)
  useEffect(() => {
    if (!mostrarAsignar || !departamentoId) return;
    listarUsuarios({ rol: 'responsable', departamento_id: departamentoId, estado: 'activo' })
      .then((r) => setResponsables(Array.isArray(r) ? r : r.usuarios || []))
      .catch((err) => setErrorAccion(mensajeDeError(err)));
  }, [mostrarAsignar, departamentoId]);

  // Si el ticket cambia de estado se limpia el formulario de solución
  const estadoActual = ticket?.estado;
  useEffect(() => {
    setResolviendo(false);
    setSolucion('');
    setResponsableId('');
  }, [estadoActual]);

  // Recibe el ticket de la API; si viniera incompleto, lo vuelve a pedir
  const aplicarTicket = useCallback(async (respuesta) => {
    setTicket(respuesta?.historial ? respuesta : await obtenerTicket(id));
  }, [id]);

  // 4-6. Ejecuta una acción, refresca el ticket y maneja errores
  async function ejecutar(accion) {
    setErrorAccion('');
    setProcesando(true);
    try {
      await aplicarTicket(await accion());
    } catch (err) {
      setErrorAccion(mensajeDeError(err));
      if (err.response?.status === 409) {
        // Otra persona lo modificó o la transición no es válida: recargar lo vigente
        obtenerTicket(id).then(setTicket).catch(() => {});
      }
    } finally {
      setProcesando(false);
    }
  }

  const asignar = () => ejecutar(() => asignarTicket(ticket._id, responsableId));
  const iniciarAtencion = () => ejecutar(() => cambiarEstado(ticket._id, { estado: 'en_proceso' }));
  const resolver = (e) => {
    e.preventDefault();
    if (!solucion.trim()) return;
    ejecutar(() => cambiarEstado(ticket._id, { estado: 'resuelto', solucion: solucion.trim() }));
  };
  const cerrar = () => {
    if (window.confirm('¿Cerrar esta solicitud? Después no podrá cambiar de estado.')) {
      ejecutar(() => cambiarEstado(ticket._id, { estado: 'cerrado' }));
    }
  };

  // ---------- Estados de la pantalla ----------
  if (cargando) return <p className="cargando">Cargando solicitud...</p>;
  if (error) {
    return (
      <div>
        <div className="aviso aviso--error" role="alert">{error}</div>
        <Link className="btn btn--secundario" to="/tickets">Volver a las solicitudes</Link>
      </div>
    );
  }
  if (!ticket) return null;

  const especificos = Object.entries(ticket.datos_especificos || {});
  const verIniciar = puedeIniciarAtencion(usuario, ticket);
  const verResolver = puedeResolver(usuario, ticket);
  const verCerrar = puedeCerrar(usuario, ticket);
  const hayAcciones = mostrarAsignar || verIniciar || verResolver || verCerrar;

  return (
    <div>
      <p><Link to="/tickets">← Volver a las solicitudes</Link></p>

      <header className="detalle__encabezado">
        <p className="detalle__codigo">{ticket.codigo}</p>
        <h1>{ticket.titulo}</h1>
        <div className="detalle__etiquetas">
          <BadgeEstado estado={ticket.estado} />
          <BadgePrioridad prioridad={ticket.prioridad} />
        </div>
      </header>

      <div className="detalle">
        <div className="detalle__principal">
          <section className="tarjeta">
            <h2>Descripción</h2>
            <p className="detalle__descripcion">{ticket.descripcion}</p>
          </section>

          {ticket.solucion && (
            <section className="tarjeta">
              <div className="detalle__solucion">
                <h3>Solución</h3>
                <p className="detalle__descripcion">{ticket.solucion}</p>
                {ticket.fecha_resolucion && <small>Resuelto el {formatearFecha(ticket.fecha_resolucion)}</small>}
              </div>
            </section>
          )}

          <section className="tarjeta">
            <h2>Datos de la solicitud</h2>
            <dl className="datos">
              <div><dt>Ubicación</dt><dd>{ticket.ubicacion}</dd></div>
              <div><dt>Categoría</dt><dd>{ticket.categoria_id?.nombre || '—'}</dd></div>
              <div><dt>Departamento</dt><dd>{ticket.departamento_id?.nombre || '—'}</dd></div>
              <div><dt>Solicitante</dt><dd>{ticket.solicitante_id?.nombre || '—'}</dd></div>
              <div><dt>Responsable</dt><dd>{ticket.responsable_id?.nombre || 'Sin asignar'}</dd></div>
              <div><dt>Creado</dt><dd>{formatearFecha(ticket.fecha_creacion)}</dd></div>
              <div><dt>Última actualización</dt><dd>{formatearFecha(ticket.fecha_actualizacion)}</dd></div>
            </dl>
          </section>

          {especificos.length > 0 && (
            <section className="tarjeta">
              <h2>Datos específicos</h2>
              <dl className="datos">
                {especificos.map(([clave, valor]) => (
                  <div key={clave}><dt>{etiquetaDeClave(clave)}</dt><dd>{String(valor)}</dd></div>
                ))}
              </dl>
            </section>
          )}

          <section className="tarjeta">
            <h2>Historial</h2>
            <Historial historial={ticket.historial} />
          </section>

          <section className="tarjeta">
            <h2>Comentarios</h2>
            <Comentarios comentarios={ticket.comentarios} ticketId={ticket._id} onActualizar={setTicket} />
          </section>
        </div>

        <aside className="detalle__lateral">
          <section className="tarjeta">
            <h2>Acciones</h2>

            {errorAccion && <div className="aviso aviso--error" role="alert">{errorAccion}</div>}

            <div className="detalle__panel-acciones">
              {mostrarAsignar && (
                <div className="campo">
                  <label htmlFor="responsable">Asignar a</label>
                  <select id="responsable" className="input" value={responsableId}
                          onChange={(e) => setResponsableId(e.target.value)} disabled={procesando}>
                    <option value="">Selecciona un responsable</option>
                    {responsables.map((r) => <option key={r._id} value={r._id}>{r.nombre}</option>)}
                  </select>
                  {responsables.length === 0 && (
                    <span className="ayuda">No hay responsables activos en {ticket.departamento_id?.nombre}.</span>
                  )}
                  <button type="button" className="btn" onClick={asignar} disabled={procesando || !responsableId}>
                    {procesando ? 'Asignando...' : 'Asignar responsable'}
                  </button>
                </div>
              )}

              {verIniciar && (
                <button type="button" className="btn" onClick={iniciarAtencion} disabled={procesando}>
                  {procesando ? 'Guardando...' : 'Iniciar atención'}
                </button>
              )}

              {verResolver && !resolviendo && (
                <button type="button" className="btn" onClick={() => setResolviendo(true)} disabled={procesando}>
                  Registrar solución
                </button>
              )}
              {verResolver && resolviendo && (
                <form className="detalle__formulario-accion" onSubmit={resolver}>
                  <div className="campo">
                    <label htmlFor="solucion">¿Cómo se resolvió?</label>
                    <textarea id="solucion" className="input" value={solucion} autoFocus
                              onChange={(e) => setSolucion(e.target.value)}
                              placeholder="Ej. Se reemplazó la fuente de poder" />
                    <span className="ayuda">Obligatorio para marcar como resuelto.</span>
                  </div>
                  <button type="submit" className="btn" disabled={procesando || !solucion.trim()}>
                    {procesando ? 'Guardando...' : 'Marcar como resuelto'}
                  </button>
                  <button type="button" className="btn btn--secundario" onClick={() => setResolviendo(false)} disabled={procesando}>
                    Cancelar
                  </button>
                </form>
              )}

              {verCerrar && (
                <button type="button" className="btn" onClick={cerrar} disabled={procesando}>
                  {procesando ? 'Cerrando...' : 'Cerrar solicitud'}
                </button>
              )}

              {!hayAcciones && (
                <p className="detalle__sin-acciones">No tienes acciones disponibles en este estado.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}