// Reportes e indicadores (R6). Solo administrador.
//
// Cómo funciona (para la defensa):
//  - Igual que el listado: "borrador" guarda lo que se escribe en los filtros y "filtros" los ya aplicados.
//  - Cada vez que cambian los filtros aplicados se pide GET /reportes/resumen; el backend hace todos los
//    cálculos (totales, tiempos promedio, agrupaciones) y esta pantalla solo los dibuja.
//  - Las gráficas son barras hechas con CSS (sin librerías nuevas). Cada barra trae su número escrito,
//    así la información no depende solo del color.
//  - "Exportar a Excel" descarga un CSV con el detalle de las solicitudes filtradas.
//  - "Imprimir" usa la impresión del navegador (se puede guardar como PDF); el menú y los filtros se ocultan.
import './Reportes.css';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerResumen, exportarReporte } from '../api/reportes';
import { listarDepartamentos } from '../api/departamentos';
import { listarCategorias } from '../api/categorias';
import { mensajeDeError } from '../api/cliente';
import { ESTADOS, PRIORIDADES, ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from '../utils/constantes';
import { formatearFecha } from '../utils/formato';
import BadgeEstado from '../components/BadgeEstado';
import BadgePrioridad from '../components/BadgePrioridad';

const hoy = () => new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
const FILTROS_INICIALES = { desde: haceDias(29), hasta: hoy(), departamento_id: '', categoria_id: '', prioridad: '' };
const RANGOS = [
  { etiqueta: '7 días', dias: 6 },
  { etiqueta: '30 días', dias: 29 },
  { etiqueta: '90 días', dias: 89 },
];

// 26.5 horas -> "1 d 2.5 h";  3.2 -> "3.2 h";  0.4 -> "24 min"
function formatearHoras(h) {
  if (h === null || h === undefined) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} h`;
  const dias = Math.floor(h / 24);
  const resto = h - dias * 24;
  return resto >= 0.5 ? `${dias} d ${resto.toFixed(0)} h` : `${dias} d`;
}
const porcentaje = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function Indicador({ titulo, valor, detalle, tono }) {
  return (
    <div className={`indicador${tono ? ` indicador--${tono}` : ''}`}>
      <span className="indicador__titulo">{titulo}</span>
      <strong className="indicador__valor">{valor}</strong>
      {detalle && <span className="indicador__detalle">{detalle}</span>}
    </div>
  );
}

// Lista de barras horizontales: [{ clave, etiqueta, valor, clase? }]
function Barras({ filas, total, vacio = 'Sin datos en este periodo' }) {
  const maximo = Math.max(1, ...filas.map((f) => f.valor));
  if (!filas.some((f) => f.valor > 0)) return <p className="reporte__vacio">{vacio}</p>;
  return (
    <ul className="barras">
      {filas.map((f) => (
        <li key={f.clave} className="barras__fila" title={`${f.etiqueta}: ${f.valor} (${porcentaje(f.valor, total)} %)`}>
          <span className="barras__etiqueta">{f.etiqueta}</span>
          <span className="barras__pista">
            <span className={`barras__barra ${f.clase || ''}`} style={{ width: `${(f.valor / maximo) * 100}%` }} />
          </span>
          <span className="barras__valor">
            {f.valor} <small>{porcentaje(f.valor, total)} %</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Columnas por día: solicitudes creadas en el periodo
function ColumnasPorDia({ dias }) {
  const maximo = Math.max(1, ...dias.map((d) => d.creados));
  if (!dias.some((d) => d.creados > 0)) return <p className="reporte__vacio">No se crearon solicitudes en este periodo</p>;
  const etiquetaDia = (f) => new Date(`${f}T12:00:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
  const cada = Math.ceil(dias.length / 8); // se rotulan unas 8 fechas para que no se encimen
  return (
    <div className="columnas" role="img" aria-label="Solicitudes creadas por día">
      <div className="columnas__area">
        {dias.map((d) => (
          <div key={d.fecha} className="columnas__col" title={`${etiquetaDia(d.fecha)}: ${d.creados} creadas, ${d.resueltos} resueltas`}>
            {d.creados > 0 && <span className="columnas__barra" style={{ height: `${(d.creados / maximo) * 100}%` }} />}
          </div>
        ))}
      </div>
      <div className="columnas__ejes">
        {dias.map((d, i) => (
          <span key={d.fecha} className="columnas__fecha">{i % cada === 0 ? etiquetaDia(d.fecha) : ''}</span>
        ))}
      </div>
      <p className="columnas__nota">Máximo diario: {maximo} solicitudes. Pase el cursor sobre una columna para ver el detalle.</p>
    </div>
  );
}

function TablaGrupo({ titulo, filas, columnaNombre }) {
  return (
    <section className="tarjeta reporte__bloque">
      <h2>{titulo}</h2>
      {filas.length === 0 ? (
        <p className="reporte__vacio">Sin datos en este periodo</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla reporte__tabla">
            <thead>
              <tr>
                <th>{columnaNombre}</th>
                <th className="num">Total</th>
                <th className="num">Abiertas</th>
                <th className="num">Resueltas</th>
                <th className="num">Tiempo prom. de resolución</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f._id}>
                  <td>{f.nombre}</td>
                  <td className="num">{f.total}</td>
                  <td className="num">{f.abiertos}</td>
                  <td className="num">{f.resueltos}</td>
                  <td className="num">{formatearHoras(f.horas_promedio_resolucion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Reportes() {
  const [borrador, setBorrador] = useState(FILTROS_INICIALES);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [datos, setDatos] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    listarDepartamentos().then((l) => setDepartamentos(Array.isArray(l) ? l : [])).catch(() => setDepartamentos([]));
    listarCategorias().then((l) => setCategorias(Array.isArray(l) ? l : [])).catch(() => setCategorias([]));
  }, []);

  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '')), [filtros]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    obtenerResumen(params)
      .then((r) => vigente && setDatos(r))
      .catch((err) => vigente && setError(mensajeDeError(err)))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [params]);

  // Si se elige un departamento, solo se ofrecen sus categorías
  const categoriasVisibles = borrador.departamento_id
    ? categorias.filter((c) => (c.departamento_id?._id || c.departamento_id) === borrador.departamento_id)
    : categorias;

  function cambiarCampo(e) {
    const { name, value } = e.target;
    setBorrador((p) => ({ ...p, [name]: value, ...(name === 'departamento_id' ? { categoria_id: '' } : {}) }));
  }
  function aplicar(e) { e.preventDefault(); setFiltros(borrador); }
  function rango(dias) { const nuevo = { ...borrador, desde: haceDias(dias), hasta: hoy() }; setBorrador(nuevo); setFiltros(nuevo); }
  function limpiar() { setBorrador(FILTROS_INICIALES); setFiltros(FILTROS_INICIALES); }

  async function exportar() {
    setExportando(true);
    setError('');
    try {
      const blob = await exportarReporte(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-solicitudes-${hoy()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setExportando(false);
    }
  }

  const nombreDe = (lista, id) => lista.find((x) => x._id === id)?.nombre;
  const resumenFiltros = [
    filtros.desde && `desde ${new Date(`${filtros.desde}T12:00:00`).toLocaleDateString('es-GT')}`,
    filtros.hasta && `hasta ${new Date(`${filtros.hasta}T12:00:00`).toLocaleDateString('es-GT')}`,
    filtros.departamento_id && `departamento ${nombreDe(departamentos, filtros.departamento_id) || ''}`,
    filtros.categoria_id && `categoría ${nombreDe(categorias, filtros.categoria_id) || ''}`,
    filtros.prioridad && `prioridad ${ETIQUETAS_PRIORIDAD[filtros.prioridad]}`,
  ].filter(Boolean).join(' · ');

  const t = datos?.totales;
  const tiempos = datos?.tiempos_promedio_horas;

  return (
    <div className="reportes">
      <div className="pagina-encabezado">
        <div>
          <h1>Reportes e indicadores</h1>
          <p>Totales y tiempos de atención de las solicitudes del hospital.</p>
        </div>
        <div className="acciones no-imprimir">
          <button type="button" className="btn btn--secundario" onClick={() => window.print()} disabled={!datos}>Imprimir</button>
          <button type="button" className="btn" onClick={exportar} disabled={exportando || !datos}>
            {exportando ? 'Exportando…' : 'Exportar a Excel'}
          </button>
        </div>
      </div>

      <form className="tarjeta filtros reporte__filtros no-imprimir" onSubmit={aplicar}>
        <div className="campo">
          <label htmlFor="r-desde">Desde</label>
          <input id="r-desde" name="desde" type="date" className="input" value={borrador.desde} onChange={cambiarCampo} max={borrador.hasta || undefined} />
        </div>
        <div className="campo">
          <label htmlFor="r-hasta">Hasta</label>
          <input id="r-hasta" name="hasta" type="date" className="input" value={borrador.hasta} onChange={cambiarCampo} min={borrador.desde || undefined} />
        </div>
        <div className="campo">
          <label htmlFor="r-dep">Departamento</label>
          <select id="r-dep" name="departamento_id" className="input" value={borrador.departamento_id} onChange={cambiarCampo}>
            <option value="">Todos</option>
            {departamentos.map((d) => <option key={d._id} value={d._id}>{d.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="r-cat">Categoría</label>
          <select id="r-cat" name="categoria_id" className="input" value={borrador.categoria_id} onChange={cambiarCampo}>
            <option value="">Todas</option>
            {categoriasVisibles.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="r-pri">Prioridad</label>
          <select id="r-pri" name="prioridad" className="input" value={borrador.prioridad} onChange={cambiarCampo}>
            <option value="">Todas</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{ETIQUETAS_PRIORIDAD[p]}</option>)}
          </select>
        </div>
        <div className="filtros__acciones">
          <button type="submit" className="btn">Generar</button>
          <button type="button" className="btn btn--secundario" onClick={limpiar}>Limpiar</button>
        </div>
        <div className="reporte__rangos" role="group" aria-label="Rangos rápidos">
          <span>Rango rápido:</span>
          {RANGOS.map((r) => (
            <button key={r.dias} type="button" className="btn btn--secundario btn--chico" onClick={() => rango(r.dias)}>{r.etiqueta}</button>
          ))}
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => { const n = { ...borrador, desde: '', hasta: '' }; setBorrador(n); setFiltros(n); }}>
            Todo el historial
          </button>
        </div>
      </form>

      <p className="reporte__criterios">
        <strong>Periodo y filtros:</strong> {resumenFiltros || 'todo el historial, sin filtros'}
        {datos && <span className="solo-imprimir"> · Generado el {formatearFecha(datos.generado)}</span>}
      </p>

      {error && <div className="aviso aviso--error" role="alert">{error}</div>}
      {cargando && !datos && <p className="cargando">Generando reporte…</p>}

      {datos && (
        <div className={cargando ? 'reporte--actualizando' : ''} aria-busy={cargando}>
          <div className="indicadores">
            <Indicador titulo="Solicitudes" valor={t.total} detalle="creadas en el periodo" />
            <Indicador titulo="Abiertas" valor={t.abiertos} detalle={`${porcentaje(t.abiertos, t.total)} % del total`} />
            <Indicador titulo="Resueltas o cerradas" valor={t.resueltos} detalle={`${porcentaje(t.resueltos, t.total)} % del total`} />
            <Indicador titulo="Críticas abiertas" valor={t.criticos_abiertos} detalle={t.criticos_abiertos ? 'requieren atención inmediata' : 'ninguna pendiente'} tono={t.criticos_abiertos ? 'alerta' : undefined} />
          </div>

          <section className="tarjeta reporte__bloque">
            <h2>Tiempos promedio de atención</h2>
            <div className="tiempos">
              <div className="tiempos__paso"><span>Creación → asignación</span><strong>{formatearHoras(tiempos.asignacion)}</strong></div>
              <span className="tiempos__flecha" aria-hidden="true">→</span>
              <div className="tiempos__paso"><span>Asignación → inicio de atención</span><strong>{formatearHoras(tiempos.inicio_atencion)}</strong></div>
              <span className="tiempos__flecha" aria-hidden="true">→</span>
              <div className="tiempos__paso tiempos__paso--total"><span>Creación → resolución</span><strong>{formatearHoras(tiempos.resolucion)}</strong></div>
            </div>
            <p className="reporte__nota">Se calcula solo con las solicitudes que ya llegaron a cada paso.</p>
          </section>

          <div className="reporte__dos">
            <section className="tarjeta reporte__bloque">
              <h2>Por estado</h2>
              <Barras total={t.total} filas={ESTADOS.map((e) => ({ clave: e, etiqueta: ETIQUETAS_ESTADO[e], valor: datos.por_estado[e], clase: `barras__barra--${e}` }))} />
            </section>
            <section className="tarjeta reporte__bloque">
              <h2>Por prioridad</h2>
              <Barras total={t.total} filas={[...PRIORIDADES].reverse().map((p) => ({ clave: p, etiqueta: ETIQUETAS_PRIORIDAD[p], valor: datos.por_prioridad[p], clase: `barras__barra--${p}` }))} />
            </section>
          </div>

          <section className="tarjeta reporte__bloque">
            <h2>Solicitudes creadas por día</h2>
            <ColumnasPorDia dias={datos.por_dia} />
          </section>

          <section className="tarjeta reporte__bloque">
            <h2>Totales por categoría</h2>
            <Barras total={t.total} filas={datos.por_categoria.map((c) => ({ clave: c._id, etiqueta: c.nombre, valor: c.total }))} />
          </section>

          <TablaGrupo titulo="Detalle por categoría" columnaNombre="Categoría" filas={datos.por_categoria} />
          <TablaGrupo titulo="Desempeño por departamento" columnaNombre="Departamento" filas={datos.por_departamento} />
          <TablaGrupo titulo="Desempeño por responsable" columnaNombre="Responsable" filas={datos.por_responsable} />

          <section className="tarjeta reporte__bloque">
            <h2>Solicitudes abiertas más antiguas</h2>
            {datos.abiertos_mas_antiguos.length === 0 ? (
              <p className="reporte__vacio">No hay solicitudes abiertas en este periodo</p>
            ) : (
              <div className="tabla-contenedor">
                <table className="tabla reporte__tabla">
                  <thead>
                    <tr><th>Código</th><th>Título</th><th>Departamento</th><th>Estado</th><th>Prioridad</th><th className="num">Días abierta</th></tr>
                  </thead>
                  <tbody>
                    {datos.abiertos_mas_antiguos.map((x) => (
                      <tr key={x._id}>
                        <td><Link to={`/tickets/${x._id}`}>{x.codigo}</Link></td>
                        <td>{x.titulo}</td>
                        <td>{x.departamento}</td>
                        <td><BadgeEstado estado={x.estado} /></td>
                        <td><BadgePrioridad prioridad={x.prioridad} /></td>
                        <td className="num">{x.dias_abierto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
