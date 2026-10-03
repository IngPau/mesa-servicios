// Administración de usuarios (solo administrador).   Módulo asignado a: ________
//
// Cómo funciona (para la defensa):
//  - Se cargan usuarios y departamentos una vez; la búsqueda y los filtros se aplican en el navegador.
//  - Crear y editar usan la misma ventana (Modal): editando === 'nuevo' crea, editando === objeto edita.
//  - No hay borrado: se activa o desactiva con estado. El backend impide que el admin se desactive
//    o se cambie el rol a sí mismo (400), por eso esas opciones se bloquean en su propia fila.
import './Admin.css';
import './Usuarios.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listarUsuarios, crearUsuario, actualizarUsuario } from '../../api/usuarios';
import { listarDepartamentos } from '../../api/departamentos';
import { mensajeDeError, datosDeError } from '../../api/cliente';
import { ETIQUETAS_ROL } from '../../utils/constantes';
import Modal from '../../components/Modal';

const FORM_VACIO = { nombre: '', usuario: '', password: '', rol: 'solicitante', departamento_id: '' };
const lista = (r, clave) => (Array.isArray(r) ? r : r?.[clave] || []);
const idDe = (d) => (d && typeof d === 'object' ? d._id : d) || '';
const iniciales = (nombre) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export default function Usuarios() {
  const { usuario: yo } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [editando, setEditando] = useState(null); // null = cerrado | 'nuevo' | objeto usuario
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([listarUsuarios(), listarDepartamentos()]);
      setUsuarios(lista(u, 'usuarios'));
      setDepartamentos(lista(d, 'departamentos'));
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
    return usuarios.filter((u) =>
      (!texto || u.nombre.toLowerCase().includes(texto) || u.usuario.toLowerCase().includes(texto)) &&
      (!filtroRol || u.rol === filtroRol) &&
      (!filtroEstado || u.estado === filtroEstado));
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const esNuevo = editando === 'nuevo';
  const esYo = !esNuevo && editando && editando._id === yo._id;
  const necesitaDepartamento = form.rol !== 'administrador';
  // En los selectos: departamentos activos (más el actual del usuario, aunque esté inactivo)
  const opcionesDepartamento = departamentos.filter((d) => d.estado === 'activo' || d._id === form.departamento_id);

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setErrorForm('');
    setEditando('nuevo');
  }

  function abrirEditar(u) {
    setForm({ nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol, departamento_id: idDe(u.departamento_id) });
    setErrorForm('');
    setEditando(u);
  }

  const cerrar = useCallback(() => setEditando(null), []);

  function cambiarCampo(e) {
    const { name, value } = e.target;
    setForm((previo) => ({ ...previo, [name]: value }));
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');

    if (!form.nombre.trim()) return setErrorForm('Escribe el nombre completo.');
    if (esNuevo && !form.usuario.trim()) return setErrorForm('Escribe el nombre de usuario.');
    if (esNuevo && form.password.length < 6) return setErrorForm('La contraseña debe tener al menos 6 caracteres.');
    if (!esNuevo && form.password && form.password.length < 6) return setErrorForm('La nueva contraseña debe tener al menos 6 caracteres.');
    if (necesitaDepartamento && !form.departamento_id) return setErrorForm('Selecciona un departamento.');

    const datos = { nombre: form.nombre.trim() };
    if (necesitaDepartamento) datos.departamento_id = form.departamento_id;
    if (form.password) datos.password = form.password;
    if (esNuevo) {
      datos.usuario = form.usuario.trim();
      datos.rol = form.rol;
    } else if (!esYo) {
      datos.rol = form.rol; // el admin no puede cambiarse el rol a sí mismo
    }

    setGuardando(true);
    try {
      if (esNuevo) await crearUsuario(datos);
      else await actualizarUsuario(editando._id, datos);
      setExito(esNuevo ? `Usuario "${datos.nombre}" creado.` : `Usuario "${datos.nombre}" actualizado.`);
      setEditando(null);
      await cargar();
    } catch (err) {
      const detalles = datosDeError(err)?.detalles;
      setErrorForm(`${mensajeDeError(err)}${Array.isArray(detalles) ? ` ${detalles.join(' ')}` : ''}`);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(u) {
    const nuevo = u.estado === 'activo' ? 'inactivo' : 'activo';
    if (nuevo === 'inactivo' && !window.confirm(`¿Desactivar a ${u.nombre}? Ya no podrá iniciar sesión.`)) return;
    setExito('');
    setError('');
    setCambiandoId(u._id);
    try {
      await actualizarUsuario(u._id, { estado: nuevo });
      setExito(`${u.nombre} ahora está ${nuevo === 'activo' ? 'activo' : 'inactivo'}.`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCambiandoId('');
    }
  }

  if (cargando) return <p className="cargando">Cargando usuarios...</p>;

  return (
    <div>
      <div className="pagina-encabezado">
        <div>
          <h1>Usuarios</h1>
          <p>Crea cuentas, cambia roles y activa o desactiva el acceso.</p>
        </div>
      </div>

      {error && <div className="aviso aviso--error" role="alert">{error}</div>}
      {exito && <div className="aviso aviso--exito" role="status">{exito}</div>}

      <div className="admin__barra">
        <input className="input" type="search" placeholder="Buscar por nombre o usuario" aria-label="Buscar"
               value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select className="input" aria-label="Filtrar por rol" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {Object.entries(ETIQUETAS_ROL).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
        <select className="input" aria-label="Filtrar por estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Activos e inactivos</option>
          <option value="activo">Solo activos</option>
          <option value="inactivo">Solo inactivos</option>
        </select>
        <button type="button" className="btn" onClick={abrirNuevo}>Nuevo usuario</button>
      </div>

      <p className="admin__resumen" aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? 'usuario' : 'usuarios'}
      </p>

      {filtrados.length === 0 ? (
        <div className="tarjeta vacio">No hay usuarios que coincidan con la búsqueda.</div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Persona</th><th>Rol</th><th>Departamento</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u._id} className={u.estado === 'inactivo' ? 'admin__fila--inactiva' : ''}>
                  <td>
                    <div className="usuarios__persona">
                      <span className="usuarios__avatar" aria-hidden="true">{iniciales(u.nombre)}</span>
                      <div>
                        <div className="usuarios__nombre">
                          {u.nombre}{u._id === yo._id && <span className="usuarios__yo">Tú</span>}
                        </div>
                        <div className="usuarios__login">@{u.usuario}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`usuarios__rol usuarios__rol--${u.rol}`}>{ETIQUETAS_ROL[u.rol] || u.rol}</span></td>
                  <td>{u.departamento_id?.nombre || '—'}</td>
                  <td><span className={`admin__estado admin__estado--${u.estado}`}>{u.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="admin__acciones-fila">
                      <button type="button" className="btn btn--secundario btn--chico" onClick={() => abrirEditar(u)}>Editar</button>
                      {u._id !== yo._id && (
                        <button type="button" className={`btn btn--chico ${u.estado === 'activo' ? 'btn--peligro' : ''}`}
                                onClick={() => alternarEstado(u)} disabled={cambiandoId === u._id}>
                          {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <Modal titulo={esNuevo ? 'Nuevo usuario' : `Editar a ${editando.nombre}`} onCerrar={cerrar}>
          <form className="formulario" onSubmit={guardar} noValidate>
            {errorForm && <div className="aviso aviso--error" role="alert">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="u-nombre">Nombre completo</label>
              <input id="u-nombre" name="nombre" className="input" value={form.nombre} onChange={cambiarCampo} autoFocus />
            </div>

            <div className="campo">
              <label htmlFor="u-usuario">Usuario</label>
              <input id="u-usuario" name="usuario" className="input" value={form.usuario} onChange={cambiarCampo}
                     disabled={!esNuevo} autoComplete="off" />
              {!esNuevo && <span className="ayuda">El nombre de usuario no se puede cambiar.</span>}
            </div>

            <div className="campo">
              <label htmlFor="u-password">{esNuevo ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
              <input id="u-password" name="password" type="password" className="input" value={form.password}
                     onChange={cambiarCampo} autoComplete="new-password" />
              <span className="ayuda">Mínimo 6 caracteres.{!esNuevo && ' Déjala vacía para no cambiarla.'}</span>
            </div>

            <div className="formulario formulario--dos">
              <div className="campo">
                <label htmlFor="u-rol">Rol</label>
                <select id="u-rol" name="rol" className="input" value={form.rol} onChange={cambiarCampo} disabled={esYo}>
                  {Object.entries(ETIQUETAS_ROL).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                </select>
                {esYo && <span className="ayuda">No puedes cambiar tu propio rol.</span>}
              </div>

              {necesitaDepartamento && (
                <div className="campo">
                  <label htmlFor="u-departamento">Departamento</label>
                  <select id="u-departamento" name="departamento_id" className="input" value={form.departamento_id} onChange={cambiarCampo}>
                    <option value="">Selecciona un departamento</option>
                    {opcionesDepartamento.map((d) => <option key={d._id} value={d._id}>{d.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="modal__pie">
              <button type="button" className="btn btn--secundario" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn" disabled={guardando}>
                {guardando ? 'Guardando...' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}