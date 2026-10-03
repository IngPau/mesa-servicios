// Pantalla de inicio de sesión.
// Versión BÁSICA y sin estilos para que todo el equipo pueda entrar al sistema y probar sus pantallas.
//
// TODO (módulo "Base"): diseño del formulario, estado de carga del botón, mostrar/ocultar contraseña.
// Credenciales de prueba: ver docs/CONTEXTO_PROYECTO_Y_API.md (sección 7), contraseña Clave123
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeDeError } from '../api/cliente';

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (usuario) return <Navigate to="/tickets" replace />;

  async function enviar(e) {
    e.preventDefault();
    setError('');
    try {
      await login(nombreUsuario, password);
      navigate('/tickets');
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <div>
      <h1>Mesa de Servicios Hospitalarios</h1>
      <form onSubmit={enviar}>
        <label>
          Usuario
          <input value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit">Iniciar sesión</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
