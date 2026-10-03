// Estructura común de las pantallas internas: menú según el rol + contenido de la página.
// TODO (diseño): estilos del menú y del contenedor. Los enlaces por rol ya están definidos.
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, ETIQUETAS_ROL } from '../utils/constantes';
import { puedeCrearTicket } from '../utils/permisos';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login');
  }

  return (
    <div>
      <header>
        <nav>
          <Link to="/tickets">Tickets</Link>
          {puedeCrearTicket(usuario) && <Link to="/tickets/nuevo">Nuevo ticket</Link>}
          {usuario.rol === ROLES.ADMINISTRADOR && (
            <>
              <Link to="/admin/usuarios">Usuarios</Link>
              <Link to="/admin/departamentos">Departamentos</Link>
              <Link to="/admin/categorias">Categorías</Link>
            </>
          )}
        </nav>
        <div>
          <span>{usuario.nombre} ({ETIQUETAS_ROL[usuario.rol]})</span>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
