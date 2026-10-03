// Formulario para crear un ticket (solicitante y administrador).   Módulo asignado a: ________
//
// Cómo funciona (para la defensa):
//  - La categoría elegida define el departamento destino y los "campos_especificos" que se piden:
//    por cada uno se dibuja un input. Lo capturado viaja en datos_especificos usando "nombre" como clave.
//  - Si ya existe un ticket abierto con la misma categoría y ubicación, la API responde 409 con
//    posible_duplicado. Se muestran los similares y el usuario decide: cancelar o crear igual (forzar: true).
//  - Si la API responde 400 con campos_faltantes, esos campos se resaltan en rojo.
import './NuevoTicket.css';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarCategorias } from '../api/categorias';
import { crearTicket } from '../api/tickets';
import { mensajeDeError, datosDeError } from '../api/cliente';
import { ETIQUETAS_PRIORIDAD } from '../utils/constantes';
import { formatearFecha } from '../utils/formato';
import BadgeEstado from '../components/BadgeEstado';
import BadgePrioridad from '../components/BadgePrioridad';

const FORM_INICIAL = {
  titulo: '',
  descripcion: '',
  categoria_id: '',
  prioridad: 'media',
  ubicacion: '',
};

export default function NuevoTicket() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [form, setForm] = useState(FORM_INICIAL);
  const [especificos, setEspecificos] = useState({});
  const [camposConError, setCamposConError] = useState([]); // nombres de campos a resaltar
  const [error, setError] = useState('');
  const [duplicados, setDuplicados] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState(null);

  // 1. Cargar categorías
  useEffect(() => {
    listarCategorias()
      .then((respuesta) => {
        const lista = Array.isArray(respuesta) ? respuesta : respuesta.categorias || [];
        setCategorias(lista);
      })
      .catch((err) => setErrorCarga(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, []);

  // 6. Tras crear, mostrar el código unos segundos y redirigir al detalle
  useEffect(() => {
    if (!creado) return undefined;
    const temporizador = setTimeout(() => navigate(`/tickets/${creado._id}`), 2000);
    return () => clearTimeout(temporizador);
  }, [creado, navigate]);

  const categoria = categorias.find((c) => c._id === form.categoria_id);
  const camposEspecificos = categoria?.campos_especificos || [];

  function cambiarCampo(e) {
    const { name, value } = e.target;
    setForm((previo) => ({ ...previo, [name]: value }));
    setCamposConError((previo) => previo.filter((c) => c !== name));
    // Si cambia la categoría o la ubicación, el aviso de duplicados deja de ser válido
    if (name === 'categoria_id' || name === 'ubicacion') setDuplicados(null);
    // Los datos específicos dependen de la categoría
    if (name === 'categoria_id') setEspecificos({});
  }

  function cambiarEspecifico(nombre, valor) {
    setEspecificos((previo) => ({ ...previo, [nombre]: valor }));
    setCamposConError((previo) => previo.filter((c) => c !== nombre));
  }

  // Validación en el navegador (la API vuelve a validar)
  function validar() {
    const faltan = [];
    if (!form.titulo.trim()) faltan.push('titulo');
    if (!form.descripcion.trim()) faltan.push('descripcion');
    if (!form.categoria_id) faltan.push('categoria_id');
    if (!form.ubicacion.trim()) faltan.push('ubicacion');
    camposEspecificos.forEach((c) => {
      if (c.requerido && !String(especificos[c.nombre] || '').trim()) faltan.push(c.nombre);
    });
    return faltan;
  }

  async function enviar(forzar = false) {
    setError('');

    const faltan = validar();
    if (faltan.length > 0) {
      setCamposConError(faltan);
      setError('Completa los campos marcados en rojo.');
      return;
    }

    // Solo se envían los datos específicos que tienen valor
    const datos_especificos = {};
    camposEspecificos.forEach((c) => {
      const valor = String(especificos[c.nombre] || '').trim();
      if (valor) datos_especificos[c.nombre] = valor;
    });

    setEnviando(true);
    try {
      const ticket = await crearTicket({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        categoria_id: form.categoria_id,
        prioridad: form.prioridad,
        ubicacion: form.ubicacion.trim(),
        datos_especificos,
        forzar,
      });
      setDuplicados(null);
      setCreado(ticket);
    } catch (err) {
      const cuerpo = datosDeError(err) || {};
      if (cuerpo.posible_duplicado) {
        // 4. Posible duplicado: el usuario decide
        setDuplicados(cuerpo.duplicados || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // 5. Resaltar campos que el backend indicó como faltantes
        if (Array.isArray(cuerpo.campos_faltantes)) {
          setCamposConError(cuerpo.campos_faltantes.map((c) => c.replace('datos_especificos.', '')));
        }
        const detalles = Array.isArray(cuerpo.detalles) ? ` ${cuerpo.detalles.join(' ')}` : '';
        setError(`${mensajeDeError(err)}${detalles}`);
      }
    } finally {
      setEnviando(false);
    }
  }

  function manejarEnvio(e) {
    e.preventDefault();
    enviar(false);
  }

  const claseCampo = (nombre) => `campo${camposConError.includes(nombre) ? ' campo--error' : ''}`;
  const textoError = (nombre) =>
    camposConError.includes(nombre) && <span className="error-texto">Este campo es obligatorio.</span>;

  // ---------- Vista de éxito ----------
  if (creado) {
    return (
      <div className="nuevo">
        <div className="tarjeta nuevo__exito" role="status">
          <h1>Solicitud registrada</h1>
          <strong>{creado.codigo}</strong>
          <p>Te llevamos al detalle de tu solicitud...</p>
          <Link className="btn" to={`/tickets/${creado._id}`}>Ver solicitud ahora</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="nuevo">
      <div className="pagina-encabezado">
        <div>
          <h1>Nueva solicitud</h1>
          <p>Describe el problema y lo enviaremos al departamento correspondiente.</p>
        </div>
      </div>

      {errorCarga && <div className="aviso aviso--error" role="alert">{errorCarga}</div>}
      {cargando && <p className="cargando">Cargando categorías...</p>}

      {/* Aviso de posible duplicado */}
      {duplicados && (
        <section className="duplicados" role="alert">
          <h2>Ya existe una solicitud parecida</h2>
          <p>Hay solicitudes abiertas con la misma categoría y ubicación. Revisa si es el mismo problema.</p>
          <ul className="duplicados__lista">
            {duplicados.map((d) => (
              <li key={d._id} className="duplicados__item">
                <Link className="duplicados__codigo" to={`/tickets/${d._id}`} target="_blank" rel="noreferrer">
                  {d.codigo}
                </Link>
                <span>{d.titulo}</span>
                <BadgeEstado estado={d.estado} />
                <BadgePrioridad prioridad={d.prioridad} />
                <span className="duplicados__fecha">{formatearFecha(d.fecha_creacion)}</span>
              </li>
            ))}
          </ul>
          <div className="acciones">
            <button type="button" className="btn btn--secundario" onClick={() => navigate('/tickets')} disabled={enviando}>
              Cancelar, ya existe
            </button>
            <button type="button" className="btn" onClick={() => enviar(true)} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Es un evento distinto, crear de todos modos'}
            </button>
          </div>
        </section>
      )}

      {!cargando && !errorCarga && (
        <form className="tarjeta formulario" onSubmit={manejarEnvio} noValidate>
          {error && <div className="aviso aviso--error" role="alert">{error}</div>}

          <div className={claseCampo('titulo')}>
            <label htmlFor="titulo">Título</label>
            <input id="titulo" name="titulo" className="input" maxLength={120}
                   placeholder="Ej. La computadora de recepción no enciende"
                   value={form.titulo} onChange={cambiarCampo} />
            {textoError('titulo')}
          </div>

          <div className={claseCampo('categoria_id')}>
            <label htmlFor="categoria_id">Categoría</label>
            <select id="categoria_id" name="categoria_id" className="input"
                    value={form.categoria_id} onChange={cambiarCampo}>
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nombre}{c.departamento_id?.nombre ? ` — ${c.departamento_id.nombre}` : ''}
                </option>
              ))}
            </select>
            {textoError('categoria_id')}
          </div>

          {categoria?.departamento_id?.nombre && (
            <div className="nuevo__destino">
              Se enviará a: <strong>{categoria.departamento_id.nombre}</strong>
            </div>
          )}

          {/* Formulario dinámico: un input por cada campo específico de la categoría */}
          {camposEspecificos.length > 0 && (
            <fieldset className="nuevo__especificos">
              <legend>Datos específicos</legend>
              {camposEspecificos.map((c) => (
                <div key={c.nombre} className={claseCampo(c.nombre)}>
                  <label htmlFor={`esp-${c.nombre}`}>
                    {c.etiqueta}{!c.requerido && ' (opcional)'}
                  </label>
                  <input id={`esp-${c.nombre}`} className="input"
                         value={especificos[c.nombre] || ''}
                         onChange={(e) => cambiarEspecifico(c.nombre, e.target.value)} />
                  {textoError(c.nombre)}
                </div>
              ))}
            </fieldset>
          )}

          <div className="formulario formulario--dos">
            <div className={claseCampo('ubicacion')}>
              <label htmlFor="ubicacion">Ubicación</label>
              <input id="ubicacion" name="ubicacion" className="input"
                     placeholder="Ej. Recepción, 2.º piso"
                     value={form.ubicacion} onChange={cambiarCampo} />
              {textoError('ubicacion')}
            </div>

            <div className="campo">
              <label htmlFor="prioridad">Prioridad</label>
              <select id="prioridad" name="prioridad" className="input"
                      value={form.prioridad} onChange={cambiarCampo}>
                {Object.entries(ETIQUETAS_PRIORIDAD).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={claseCampo('descripcion')}>
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" name="descripcion" className="input"
                      placeholder="¿Qué pasó? ¿Desde cuándo? ¿Qué se intentó?"
                      value={form.descripcion} onChange={cambiarCampo} />
            {textoError('descripcion')}
          </div>

          <div className="nuevo__acciones">
            <button type="button" className="btn btn--secundario" onClick={() => navigate('/tickets')} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={enviando || !!duplicados}>
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}