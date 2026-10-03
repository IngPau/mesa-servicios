// Administración de departamentos (solo administrador).   Módulo asignado a: ________
//
// Cómo funciona (para la defensa):
//  - El administrador ve departamentos activos e inactivos. No hay borrado: se desactivan.
//  - Crear y editar comparten la ventana (Modal): editando === 'nuevo' crea, editando === objeto edita.
import './Admin.css';
import './Departamentos.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listarDepartamentos, crearDepartamento, actualizarDepartamento } from '../../api/departamentos';
import { mensajeDeError, datosDeError } from '../../api/cliente';
import Modal from '../../components/Modal';

const FORM_VACIO = { nombre: '', descripcion: '' };
const lista = (r, clave) => (Array.isArray(r) ? r : r?.[clave] || []);

export default function Departamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [editando, setEditando] = useState(null); // null = cerrado | 'nuevo' | objeto departamento
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState('');

  const cargar = useCallback(async () => {
    try {
      setDepartamentos(lista(await listarDepartamentos(), 'departamentos'));
      setError('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return departamentos.filter((d) =>
      (!texto || d.nombre.toLowerCase().includes(texto)) && (!filtroEstado || d.estado === filtroEstado));
  }, [departamentos, busqueda, filtroEstado]);

  const esNuevo = editando === 'nuevo';
  const cerrar = useCallback(() => setEditando(null), []);

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setErrorForm('');
    setEditando('nuevo');
  }

  function abrirEditar(d) {
    setForm({ nombre: d.nombre, descripcion: d.descripcion || '' });
    setErrorForm('');
    setEditando(d);
  }

  function cambiarCampo(e) {
    const { name, value } = e.target;
    setForm((previo) => ({ ...previo, [name]: value }));
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    if (!form.nombre.trim()) return setErrorForm('Escribe el nombre del departamento.');

    const datos = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() };
    setGuardando(true);
    try {
      if (esNuevo) await crearDepartamento(datos);
      else await actualizarDepartamento(editando._id, datos);
      setExito(esNuevo ? `Departamento "${datos.nombre}" creado.` : `Departamento "${datos.nombre}" actualizado.`);
      setEditando(null);
      await cargar();
    } catch (err) {
      const detalles = datosDeError(err)?.detalles;
      setErrorForm(`${mensajeDeError(err)}${Array.isArray(detalles) ? ` ${detalles.join(' ')}` : ''}`);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(d) {
    const nuevo = d.estado === 'activo' ? 'inactivo' : 'activo';
    if (nuevo === 'inactivo' && !window.confirm(`¿Desactivar el departamento "${d.nombre}"?`)) return;
    setExito('');
    setError('');
    setCambiandoId(d._id);
    try {
      await actualizarDepartamento(d._id, { nombre: d.nombre, descripcion: d.descripcion || '', estado: nuevo });
      setExito(`"${d.nombre}" ahora está ${nuevo === 'activo' ? 'activo' : 'inactivo'}.`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCambiandoId('');
    }
  }

  if (cargando) return <p className="cargando">Cargando departamentos...</p>;

  return (
    <div>
      <div className="pagina-encabezado">
        <div>
          <h1>Departamentos</h1>
          <p>Las áreas del hospital que atienden solicitudes.</p>
        </div>
      </div>

      {error && <div className="aviso aviso--error" role="alert">{error}</div>}
      {exito && <div className="aviso aviso--exito" role="status">{exito}</div>}

      <div className="admin__barra">
        <input className="input" type="search" placeholder="Buscar departamento" aria-label="Buscar"
               value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select className="input" aria-label="Filtrar por estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Activos e inactivos</option>
          <option value="activo">Solo activos</option>
          <option value="inactivo">Solo inactivos</option>
        </select>
        <button type="button" className="btn" onClick={abrirNuevo}>Nuevo departamento</button>
      </div>

      <p className="admin__resumen" aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? 'departamento' : 'departamentos'}
      </p>

      {filtrados.length === 0 ? (
        <div className="tarjeta vacio">No hay departamentos que coincidan con la búsqueda.</div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
            </thead>
            <tbody>
              {filtrados.map((d) => (
                <tr key={d._id} className={d.estado === 'inactivo' ? 'admin__fila--inactiva' : ''}>
                  <td className="departamentos__nombre">{d.nombre}</td>
                  <td>
                    {d.descripcion
                      ? <div className="departamentos__descripcion">{d.descripcion}</div>
                      : <span className="departamentos__sin-descripcion">Sin descripción</span>}
                  </td>
                  <td><span className={`admin__estado admin__estado--${d.estado}`}>{d.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="admin__acciones-fila">
                      <button type="button" className="btn btn--secundario btn--chico" onClick={() => abrirEditar(d)}>Editar</button>
                      <button type="button" className={`btn btn--chico ${d.estado === 'activo' ? 'btn--peligro' : ''}`}
                              onClick={() => alternarEstado(d)} disabled={cambiandoId === d._id}>
                        {d.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <Modal titulo={esNuevo ? 'Nuevo departamento' : `Editar ${editando.nombre}`} onCerrar={cerrar}>
          <form className="formulario" onSubmit={guardar} noValidate>
            {errorForm && <div className="aviso aviso--error" role="alert">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="d-nombre">Nombre</label>
              <input id="d-nombre" name="nombre" className="input" value={form.nombre} onChange={cambiarCampo} autoFocus />
            </div>

            <div className="campo">
              <label htmlFor="d-descripcion">Descripción (opcional)</label>
              <textarea id="d-descripcion" name="descripcion" className="input" value={form.descripcion}
                        onChange={cambiarCampo} placeholder="¿Qué tipo de solicitudes atiende?" />
            </div>

            <div className="modal__pie">
              <button type="button" className="btn btn--secundario" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn" disabled={guardando}>
                {guardando ? 'Guardando...' : esNuevo ? 'Crear departamento' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}