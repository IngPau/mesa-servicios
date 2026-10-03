// Cliente HTTP único para toda la aplicación. Todas las llamadas a la API pasan por aquí.
import axios from 'axios';

export const CLAVE_TOKEN = 'mesa_token';
export const CLAVE_USUARIO = 'mesa_usuario';

const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Agrega el token JWT a cada petición
cliente.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si la API responde 401 (sin sesión / token vencido), se cierra la sesión y se manda al login
cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !esLogin) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Texto de error listo para mostrar al usuario (el backend ya responde en español)
export function mensajeDeError(error) {
  return error.response?.data?.mensaje || 'No se pudo conectar con el servidor';
}

// Cuerpo completo del error, por si hace falta (ej. error.response.data.duplicados o campos_faltantes)
export function datosDeError(error) {
  return error.response?.data ?? null;
}

export default cliente;
