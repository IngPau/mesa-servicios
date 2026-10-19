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
  const [mostrarPassword, setMostrarPassword] = useState(false); // Estado para alternar visibilidad
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(usuario.trim(), password);
      navigate('/', { replace: true });
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
          <img 
            src="/logo2.png" 
            alt="Logo Sanatorio Santa Cruz" 
            className="login__logo" 
          />
          <span>Sanatorio<br />Santa Cruz</span>
        </div>

        <div className="login__mensaje">
          <h1>Cada solicitud del hospital, en un solo lugar.</h1>
          <p>Registra fallas, da seguimiento y consulta qué pasó con cada solicitud.</p>
        </div>

        <small className="login__pie">Sanatorio Santa Cruz · Uso interno</small>
      </aside>

      <section className="login__panel">
        <div className="login__caja">
          <h2>Iniciar sesión</h2>
          {error && <div className="aviso aviso--error" role="alert">{error}</div>}

          <form className="formulario" onSubmit={manejarEnvio}>
            <div className="campo">
              <label htmlFor="usuario">Usuario</label>
              <input 
                id="usuario" 
                className="input" 
                value={usuario} 
                autoComplete="username"
                onChange={(e) => setUsuario(e.target.value)} 
                required 
                autoFocus 
              />
            </div>
            
            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <div className="campo__password">
                <input 
                  id="password" 
                  type={mostrarPassword ? 'text' : 'password'} 
                  className="input" 
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="btn-ojo"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
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