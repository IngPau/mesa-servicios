// Mapa de rutas de la aplicación. Si agregas una pantalla nueva, regístrala aquí.
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from './utils/constantes';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Reportes from './pages/Reportes';
import Tickets from './pages/Tickets';
import TicketDetalle from './pages/TicketDetalle';
import NuevoTicket from './pages/NuevoTicket';
import Usuarios from './pages/admin/Usuarios';
import Departamentos from './pages/admin/Departamentos';
import Categorias from './pages/admin/Categorias';
import NoEncontrada from './pages/NoEncontrada';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Todo lo que está dentro requiere sesión iniciada y se muestra dentro del Layout (menú) */}
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        <Route path="inicio" element={<Navigate to="/" replace />} />
        <Route path="tickets" element={<Tickets />} />
        <Route
          path="tickets/nuevo"
          element={
            <RutaProtegida roles={[ROLES.SOLICITANTE, ROLES.ADMINISTRADOR]}>
              <NuevoTicket />
            </RutaProtegida>
          }
        />
        <Route path="tickets/:id" element={<TicketDetalle />} />

        {/* Solo administrador */}
        <Route path="admin/usuarios" element={<RutaProtegida roles={[ROLES.ADMINISTRADOR]}><Usuarios /></RutaProtegida>} />
        <Route path="admin/departamentos" element={<RutaProtegida roles={[ROLES.ADMINISTRADOR]}><Departamentos /></RutaProtegida>} />
        <Route path="admin/categorias" element={<RutaProtegida roles={[ROLES.ADMINISTRADOR]}><Categorias /></RutaProtegida>} />
        <Route path="reportes" element={<RutaProtegida roles={[ROLES.ADMINISTRADOR]}><Reportes /></RutaProtegida>} />
      </Route>

      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  );
}
