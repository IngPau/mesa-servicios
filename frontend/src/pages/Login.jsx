import './Login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeDeError } from '../api/cliente';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(usuario.trim(), password);
      navigate('/tickets', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__lateral">
        <div className="login__marca">
          <span className="login__logo" aria-hidden="true" />
          <span>Mesa de<br />Servicios</span>
        </div>

        <div className="login__mensaje">
          <h1>Cada solicitud del hospital, en un solo lugar.</h1>
          <p>Registra fallas, da seguimiento y consulta qué pasó con cada solicitud.</p>
          <ul className="login__flujo" aria-label="Recorrido de una solicitud">
            <li>Pendiente</li>
            <li>Asignado</li>
            <li>En proceso</li>
            <li>Resuelto</li>
            <li>Cerrado</li>
          </ul>
        </div>

        <small className="login__pie">Hospital · Uso interno</small>
      </aside>

      <section className="login__panel">
        <div className="login__caja">
          <h2>Iniciar sesión</h2>
          <p className="login__subtitulo">Ingresa con tu usuario del hospital.</p>

          {error && <div className="aviso aviso--error" role="alert">{error}</div>}

          <form className="formulario" onSubmit={manejarEnvio}>
            <div className="campo">
              <label htmlFor="usuario">Usuario</label>
              <input id="usuario" className="input" value={usuario} autoComplete="username"
                     onChange={(e) => setUsuario(e.target.value)} required autoFocus />
            </div>
            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <input id="password" type="password" className="input" value={password}
                     autoComplete="current-password"
                     onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn" disabled={enviando}>
              {enviando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}