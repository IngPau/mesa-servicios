// Listado y búsqueda de tickets.   Módulo asignado a: ________
//
// Cómo funciona (para la defensa):
//  - "borrador" guarda lo que el usuario escribe en los filtros; "filtros" guarda los que ya se aplicaron.
//    Así no se consulta la API en cada tecla: solo al pulsar "Buscar".
//  - Un useEffect vuelve a pedir los tickets cuando cambian los filtros aplicados o la página.
//  - La API ya limita los resultados según el rol (solicitante: suyos, responsable: su departamento, admin: todos).
import './Tickets.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarTickets } from '../api/tickets';
import { listarDepartamentos } from '../api/departamentos';
import { mensajeDeError } from '../api/cliente';
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from '../utils/constantes';
import { puedeCrearTicket } from '../utils/permisos';
import { formatearFecha } from '../utils/formato';
import BadgeEstado from '../components/BadgeEstado';
import BadgePrioridad from '../components/BadgePrioridad';

const LIMITE = 20;
const FILTROS_VACIOS = {
  codigo: '',
  estado: '',
  prioridad: '',
  departamento_id: '',
  desde: '',
  hasta: '',
  asignado_a_mi: false,
};

export default function Tickets() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'administrador';
  const esResponsable = usuario.rol === 'responsable';

  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // Departamentos para el filtro (solo el administrador lo ve)
  useEffect(() => {
    if (!esAdmin) return;
    listarDepartamentos()
      .then((lista) => setDepartamentos(Array.isArray(lista) ? lista : lista.departamentos || []))
      .catch(() => setDepartamentos([]));
  }, [esAdmin]);

  // Cargar tickets cuando cambian los filtros aplicados o la página
  useEffect(() => {
    let vigente = true; // evita pintar una respuesta vieja si el usuario ya pidió otra
    setCargando(true);
    setError('');

    const params = { pagina, limite: LIMITE };
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor === '' || valor === false) return;
      params[clave] = valor === true ? 'true' : valor;
    });

    listarTickets(params)
      .then((respuesta) => vigente && setDatos(respuesta))
      .catch((err) => vigente && setError(mensajeDeError(err)))
      .finally(() => vigente && setCargando(false));

    return () => { vigente = false; };
  }, [filtros, pagina]);

  function cambiarCampo(e) {
    const { name, type, value, checked } = e.target;
    setBorrador((previo) => ({ ...previo, [name]: type === 'checkbox' ? checked : value }));
  }

  function buscar(e) {
    e.preventDefault();
    setPagina(1);
    setFiltros(borrador);
  }

  function limpiar() {
    setBorrador(FILTROS_VACIOS);
    setPagina(1);
    setFiltros(FILTROS_VACIOS);
  }

  const tickets = datos?.tickets || [];
  const total = datos?.total || 0;
  const totalPaginas = datos?.paginas || 1;

  return (
    <div>
      <div className="pagina-encabezado">
        <div>
          <h1>Solicitudes</h1>
          <p>
            {usuario.rol === 'solicitante' && 'Las solicitudes que has registrado.'}
            {esResponsable && 'Las solicitudes de tu departamento.'}
            {esAdmin && 'Todas las solicitudes del hospital.'}
          </p>
        </div>
        {puedeCrearTicket(usuario) && (
          <Link className="btn" to="/tickets/nuevo">Nueva solicitud</Link>
        )}
      </div>

      <form className="tarjeta filtros" onSubmit={buscar}>
        <div className="campo">
          <label htmlFor="f-codigo">Código</label>
          <input id="f-codigo" name="codigo" className="input" placeholder="TK-0000"
                 value={borrador.codigo} onChange={cambiarCampo} />
        </div>

        <div className="campo">
          <label htmlFor="f-estado">Estado</label>
          <select id="f-estado" name="estado" className="input" value={borrador.estado} onChange={cambiarCampo}>
            <option value="">Todos</option>
            {Object.entries(ETIQUETAS_ESTADO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="f-prioridad">Prioridad</label>
          <select id="f-prioridad" name="prioridad" className="input" value={borrador.prioridad} onChange={cambiarCampo}>
            <option value="">Todas</option>
            {Object.entries(ETIQUETAS_PRIORIDAD).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
        </div>

        {esAdmin && (
          <div className="campo">
            <label htmlFor="f-departamento">Departamento</label>
            <select id="f-departamento" name="departamento_id" className="input"
                    value={borrador.departamento_id} onChange={cambiarCampo}>
              <option value="">Todos</option>
              {departamentos.map((d) => (
                <option key={d._id} value={d._id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="campo">
          <label htmlFor="f-desde">Desde</label>
          <input id="f-desde" type="date" name="desde" className="input" value={borrador.desde} onChange={cambiarCampo} />
        </div>

        <div className="campo">
          <label htmlFor="f-hasta">Hasta</label>
          <input id="f-hasta" type="date" name="hasta" className="input" value={borrador.hasta} onChange={cambiarCampo} />
        </div>

        {esResponsable && (
          <label className="filtros__bandeja">
            <input type="checkbox" name="asignado_a_mi" checked={borrador.asignado_a_mi} onChange={cambiarCampo} />
            Asignados a mí
          </label>
        )}

        <div className="filtros__acciones">
          <button type="submit" className="btn" disabled={cargando}>Buscar</button>
          <button type="button" className="btn btn--secundario" onClick={limpiar} disabled={cargando}>Limpiar</button>
        </div>
      </form>

      {error && <div className="aviso aviso--error" role="alert">{error}</div>}

      {cargando && !datos && <p className="cargando">Cargando solicitudes...</p>}

      {datos && !error && (
        <>
          {total === 0 ? (
            <div className="tarjeta vacio">
              {datos.mensaje || 'No se encontraron solicitudes con los criterios indicados'}
            </div>
          ) : (
            <>
              <p className="tickets__resumen" aria-live="polite">
                {cargando ? 'Actualizando...' : `${total} ${total === 1 ? 'solicitud' : 'solicitudes'}`}
              </p>

              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                      <th>Categoría</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t._id} className={t.prioridad === 'critica' ? 'tickets__fila--critica' : ''}>
                        <td><Link className="tickets__codigo" to={`/tickets/${t._id}`}>{t.codigo}</Link></td>
                        <td><div className="tickets__titulo" title={t.titulo}>{t.titulo}</div></td>
                        <td><BadgeEstado estado={t.estado} /></td>
                        <td><BadgePrioridad prioridad={t.prioridad} /></td>
                        <td>{t.categoria_id?.nombre || '—'}</td>
                        <td>{formatearFecha(t.fecha_creacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="paginacion" aria-label="Paginación">
                <button type="button" className="btn btn--secundario btn--chico"
                        onClick={() => setPagina((p) => p - 1)} disabled={cargando || pagina <= 1}>
                  Anterior
                </button>
                <span>Página {pagina} de {totalPaginas}</span>
                <button type="button" className="btn btn--secundario btn--chico"
                        onClick={() => setPagina((p) => p + 1)} disabled={cargando || pagina >= totalPaginas}>
                  Siguiente
                </button>
              </nav>
            </>
          )}
        </>
      )}
    </div>
  );
}