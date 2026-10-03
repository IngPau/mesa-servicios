// Administración de categorías (solo administrador).   Módulo asignado a: ________
//
// Cómo funciona (para la defensa):
//  - Cada categoría pertenece a un departamento (el que atiende esas solicitudes) y define sus
//    "campos_especificos": los datos extra que el formulario de "Nueva solicitud" pedirá para ella.
//  - Cada campo tiene "etiqueta" (texto que ve el usuario), "nombre" (clave técnica que se guarda en
//    datos_especificos del ticket) y "requerido". El nombre se genera solo a partir de la etiqueta.
//  - Los campos que ya existían no cambian de nombre, para no romper los tickets ya creados.
import './Admin.css';
import './Categorias.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listarCategorias, crearCategoria, actualizarCategoria } from '../../api/categorias';
import { listarDepartamentos } from '../../api/departamentos';
import { mensajeDeError, datosDeError } from '../../api/cliente';
import Modal from '../../components/Modal';

const lista = (r, clave) => (Array.isArray(r) ? r : r?.[clave] || []);
const idDe = (d) => (d && typeof d === 'object' ? d._id : d) || '';

// "Número de serie" -> "numero_serie"
function aClave(texto) {
  const clave = texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return /^[0-9]/.test(clave) ? `campo_${clave}` : clave;
}

export default function Categorias() {
  const contador = useRef(0); // identificador local de cada fila del editor
  const nuevaFila = (datos = {}) => ({
    uid: ++contador.current, nombre: '', etiqueta: '', requerido: false, existente: false, manual: false, ...datos,
  });

  const [categorias, setCategorias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroDepto, setFiltroDepto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [editando, setEditando] = useState(null); // null = cerrado | 'nueva' | objeto categoría
  const [form, setForm] = useState({ nombre: '', descripcion: '', departamento_id: '' });
  const [campos, setCampos] = useState([]);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([listarCategorias(), listarDepartamentos()]);
      setCategorias(lista(c, 'categorias'));
      setDepartamentos(lista(d, 'departamentos'));
      setError('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return categorias.filter((c) =>
      (!texto || c.nombre.toLowerCase().includes(texto)) &&
      (!filtroDepto || idDe(c.departamento_id) === filtroDepto) &&
      (!filtroEstado || c.estado === filtroEstado));
  }, [categorias, busqueda, filtroDepto, filtroEstado]);

  const esNueva = editando === 'nueva';
  const cerrar = useCallback(() => setEditando(null), []);
  const opcionesDepartamento = departamentos.filter((d) => d.estado === 'activo' || d._id === form.departamento_id);

  function abrirNueva() {
    setForm({ nombre: '', descripcion: '', departamento_id: '' });
    setCampos([]);
    setErrorForm('');
    setEditando('nueva');
  }

  function abrirEditar(c) {
    setForm({ nombre: c.nombre, descripcion: c.descripcion || '', departamento_id: idDe(c.departamento_id) });
    setCampos((c.campos_especificos || []).map((f) =>
      nuevaFila({ nombre: f.nombre, etiqueta: f.etiqueta, requerido: !!f.requerido, existente: true, manual: true })));
    setErrorForm('');
    setEditando(c);
  }

  function cambiarCampoForm(e) {
    const { name, value } = e.target;
    setForm((previo) => ({ ...previo, [name]: value }));
  }

  // ----- Editor de campos específicos -----
  const agregarCampo = () => setCampos((previo) => [...previo, nuevaFila()]);
  const quitarCampo = (uid) => setCampos((previo) => previo.filter((f) => f.uid !== uid));

  function cambiarEtiqueta(uid, etiqueta) {
    setCampos((previo) => previo.map((f) =>
      f.uid === uid ? { ...f, etiqueta, nombre: f.manual ? f.nombre : aClave(etiqueta) } : f));
  }
  function cambiarNombre(uid, nombre) {
    setCampos((previo) => previo.map((f) => (f.uid === uid ? { ...f, nombre: aClave(nombre), manual: true } : f)));
  }
  function cambiarRequerido(uid, requerido) {
    setCampos((previo) => previo.map((f) => (f.uid === uid ? { ...f, requerido } : f)));
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');

    if (!form.nombre.trim()) return setErrorForm('Escribe el nombre de la categoría.');
    if (!form.departamento_id) return setErrorForm('Selecciona el departamento que la atiende.');

    const usados = new Set();
    for (const f of campos) {
      if (!f.etiqueta.trim()) return setErrorForm('Cada campo específico necesita una etiqueta.');
      if (!f.nombre) return setErrorForm(`El campo "${f.etiqueta}" necesita un nombre técnico válido.`);
      if (usados.has(f.nombre)) return setErrorForm(`El nombre técnico "${f.nombre}" está repetido.`);
      usados.add(f.nombre);
    }

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      departamento_id: form.departamento_id,
      campos_especificos: campos.map((f) => ({ nombre: f.nombre, etiqueta: f.etiqueta.trim(), requerido: f.requerido })),
    };

    setGuardando(true);
    try {
      if (esNueva) await crearCategoria(datos);
      else await actualizarCategoria(editando._id, datos);
      setExito(esNueva ? `Categoría "${datos.nombre}" creada.` : `Categoría "${datos.nombre}" actualizada.`);
      setEditando(null);
      await cargar();
    } catch (err) {
      const detalles = datosDeError(err)?.detalles;
      setErrorForm(`${mensajeDeError(err)}${Array.isArray(detalles) ? ` ${detalles.join(' ')}` : ''}`);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(c) {
    const nuevo = c.estado === 'activo' ? 'inactivo' : 'activo';
    if (nuevo === 'inactivo' && !window.confirm(`¿Desactivar la categoría "${c.nombre}"? Ya no se podrá elegir en nuevas solicitudes.`)) return;
    setExito('');
    setError('');
    setCambiandoId(c._id);
    try {
      await actualizarCategoria(c._id, { estado: nuevo });
      setExito(`"${c.nombre}" ahora está ${nuevo === 'activo' ? 'activa' : 'inactiva'}.`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCambiandoId('');
    }
  }

  if (cargando) return <p className="cargando">Cargando categorías...</p>;

  return (
    <div>
      <div className="pagina-encabezado">
        <div>
          <h1>Categorías</h1>
          <p>Clasifican las solicitudes y definen qué datos extra se piden.</p>
        </div>
      </div>

      {error && <div className="aviso aviso--error" role="alert">{error}</div>}
      {exito && <div className="aviso aviso--exito" role="status">{exito}</div>}

      <div className="admin__barra">
        <input className="input" type="search" placeholder="Buscar categoría" aria-label="Buscar"
               value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select className="input" aria-label="Filtrar por departamento" value={filtroDepto} onChange={(e) => setFiltroDepto(e.target.value)}>
          <option value="">Todos los departamentos</option>
          {departamentos.map((d) => <option key={d._id} value={d._id}>{d.nombre}</option>)}
        </select>
        <select className="input" aria-label="Filtrar por estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Activas e inactivas</option>
          <option value="activo">Solo activas</option>
          <option value="inactivo">Solo inactivas</option>
        </select>
        <button type="button" className="btn" onClick={abrirNueva}>Nueva categoría</button>
      </div>

      <p className="admin__resumen" aria-live="polite">
        {filtradas.length} {filtradas.length === 1 ? 'categoría' : 'categorías'}
      </p>

      {filtradas.length === 0 ? (
        <div className="tarjeta vacio">No hay categorías que coincidan con la búsqueda.</div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Categoría</th><th>Departamento</th><th>Datos específicos</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c._id} className={c.estado === 'inactivo' ? 'admin__fila--inactiva' : ''}>
                  <td>
                    <div className="categorias__nombre">{c.nombre}</div>
                    {c.descripcion && <div className="categorias__descripcion">{c.descripcion}</div>}
                  </td>
                  <td>{c.departamento_id?.nombre || '—'}</td>
                  <td>
                    {(c.campos_especificos || []).length === 0 ? (
                      <span className="categorias__sin-campos">—</span>
                    ) : (
                      <div className="categorias__chips">
                        {c.campos_especificos.map((f) => (
                          <span key={f.nombre} className={`categorias__chip${f.requerido ? ' categorias__chip--requerido' : ''}`}>{f.etiqueta}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td><span className={`admin__estado admin__estado--${c.estado}`}>{c.estado === 'activo' ? 'Activa' : 'Inactiva'}</span></td>
                  <td>
                    <div className="admin__acciones-fila">
                      <button type="button" className="btn btn--secundario btn--chico" onClick={() => abrirEditar(c)}>Editar</button>
                      <button type="button" className={`btn btn--chico ${c.estado === 'activo' ? 'btn--peligro' : ''}`}
                              onClick={() => alternarEstado(c)} disabled={cambiandoId === c._id}>
                        {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin__nota">Los datos específicos marcados con * son obligatorios al crear la solicitud.</p>

      {editando && (
        <Modal ancho titulo={esNueva ? 'Nueva categoría' : `Editar ${editando.nombre}`} onCerrar={cerrar}>
          <form className="formulario" onSubmit={guardar} noValidate>
            {errorForm && <div className="aviso aviso--error" role="alert">{errorForm}</div>}

            <div className="formulario formulario--dos">
              <div className="campo">
                <label htmlFor="c-nombre">Nombre</label>
                <input id="c-nombre" name="nombre" className="input" value={form.nombre} onChange={cambiarCampoForm} autoFocus />
              </div>
              <div className="campo">
                <label htmlFor="c-departamento">Departamento que la atiende</label>
                <select id="c-departamento" name="departamento_id" className="input" value={form.departamento_id} onChange={cambiarCampoForm}>
                  <option value="">Selecciona un departamento</option>
                  {opcionesDepartamento.map((d) => <option key={d._id} value={d._id}>{d.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="c-descripcion">Descripción (opcional)</label>
              <textarea id="c-descripcion" name="descripcion" className="input" value={form.descripcion} onChange={cambiarCampoForm} />
            </div>

            <fieldset className="categorias__editor">
              <legend>Datos específicos</legend>
              <p className="categorias__editor-ayuda">
                Preguntas extra que se piden al crear una solicitud de esta categoría. Por ejemplo: "Tipo de equipo".
              </p>

              {campos.map((f) => (
                <div className="categorias__campo" key={f.uid}>
                  <div className="campo">
                    <label htmlFor={`etq-${f.uid}`}>Etiqueta</label>
                    <input id={`etq-${f.uid}`} className="input" value={f.etiqueta} placeholder="Ej. Tipo de equipo"
                           onChange={(e) => cambiarEtiqueta(f.uid, e.target.value)} />
                  </div>
                  <div className="campo">
                    <label htmlFor={`nom-${f.uid}`}>Nombre técnico</label>
                    <input id={`nom-${f.uid}`} className="input" value={f.nombre} disabled={f.existente}
                           onChange={(e) => cambiarNombre(f.uid, e.target.value)} />
                  </div>
                  <label className="categorias__requerido">
                    <input type="checkbox" checked={f.requerido} onChange={(e) => cambiarRequerido(f.uid, e.target.checked)} />
                    Obligatorio
                  </label>
                  <button type="button" className="btn btn--secundario btn--chico categorias__quitar" onClick={() => quitarCampo(f.uid)}>
                    Quitar
                  </button>
                </div>
              ))}

              <button type="button" className="btn btn--secundario btn--chico categorias__agregar" onClick={agregarCampo}>
                Agregar campo
              </button>
            </fieldset>

            <div className="modal__pie">
              <button type="button" className="btn btn--secundario" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn" disabled={guardando}>
                {guardando ? 'Guardando...' : esNueva ? 'Crear categoría' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}