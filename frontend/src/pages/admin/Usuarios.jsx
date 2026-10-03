// Administración de usuarios (solo administrador).   Módulo asignado a: ________
//
// TODO:
//  1. Listar con listarUsuarios() de api/usuarios.js (filtros opcionales: rol, estado, departamento).
//  2. Crear usuario: nombre, usuario, contraseña (mín. 6), rol y departamento
//     (el departamento es OBLIGATORIO para solicitante y responsable; el administrador puede no tenerlo).
//     Cargar departamentos con listarDepartamentos().
//  3. Editar usuario (nombre, rol, departamento, nueva contraseña opcional).
//  4. Activar / desactivar con actualizarUsuario(id, { estado: 'inactivo' | 'activo' }). No hay borrado.
//  5. Mostrar errores de la API (409 = usuario duplicado; 400 = no puedes desactivarte a ti mismo).
export default function Usuarios() {
  return (
    <div>
      <h1>Usuarios</h1>
      <p>Pendiente de implementar</p>
    </div>
  );
}
