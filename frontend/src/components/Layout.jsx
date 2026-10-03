import './Layout.css';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { puedeCrearTicket } from '../utils/permisos';
import { ETIQUETAS_ROL } from '../utils/constantes';

// Barra lateral con el menú según el rol + el contenido de la página (<Outlet />).
// En pantallas pequeñas la barra pasa a ser una franja superior (ver global.css).
function Enlace({ to, end, children }) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => `menu__enlace${isActive ? ' activo' : ''}`}>
        {children}
      </NavLink>
    </li>
  );
}

export default function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="app">
      <nav className="menu" aria-label="Menú principal">
        <div className="marca">
          <span className="marca__icono" aria-hidden="true" />
          <span>Mesa de<br />Servicios</span>
        </div>

        <ul className="menu__lista">
          <Enlace to="/tickets" end>Solicitudes</Enlace>
          {puedeCrearTicket(usuario) && <Enlace to="/tickets/nuevo">Nueva solicitud</Enlace>}

          {usuario.rol === 'administrador' && (
            <>
              <li className="menu__titulo">Administración</li>
              <Enlace to="/admin/usuarios">Usuarios</Enlace>
              <Enlace to="/admin/departamentos">Departamentos</Enlace>
              <Enlace to="/admin/categorias">Categorías</Enlace>
            </>
          )}
        </ul>

        <div className="menu__usuario">
          <div>
            <strong>{usuario.nombre}</strong>
            <span>
              {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
              {usuario.departamento_id ? ` · ${usuario.departamento_id.nombre}` : ''}
            </span>
          </div>
          <button type="button" className="btn btn--menu btn--chico" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
