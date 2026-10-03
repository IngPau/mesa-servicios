// Protege pantallas: sin sesión -> login; con sesión pero sin el rol permitido -> /tickets.
// Uso:  <RutaProtegida roles={['administrador']}><Pantalla /></RutaProtegida>
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <p>Cargando...</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/tickets" replace />;

  return children;
}
