// Guarda la sesión (token + usuario) y la comparte con toda la app.
// Uso en cualquier componente:  const { usuario, login, logout } = useAuth();
import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, me } from '../api/auth';
import { CLAVE_TOKEN, CLAVE_USUARIO } from '../api/cliente';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_USUARIO));
    } catch {
      return null;
    }
  });
  // "cargando" es true mientras se valida el token guardado (evita parpadeos al recargar la página)
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem(CLAVE_TOKEN)));

  function guardarUsuario(u) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    setUsuario(u);
  }

  function cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  }

  // Al recargar la página: si hay token, se confirma con el backend que sigue siendo válido
  useEffect(() => {
    if (!localStorage.getItem(CLAVE_TOKEN)) return;
    me()
      .then(guardarUsuario)
      .catch(cerrarSesion)
      .finally(() => setCargando(false));
  }, []);

  // Lanza un error si las credenciales son incorrectas (usar mensajeDeError para mostrarlo)
  async function login(nombreUsuario, password) {
    const datos = await apiLogin(nombreUsuario, password);
    localStorage.setItem(CLAVE_TOKEN, datos.token);
    guardarUsuario(datos.usuario);
    return datos.usuario;
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout: cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
