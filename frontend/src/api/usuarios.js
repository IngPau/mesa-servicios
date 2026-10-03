import cliente from './cliente';

// Todo este módulo es solo para el administrador.

// GET /usuarios?rol=&estado=&departamento_id=
export const listarUsuarios = (params = {}) => cliente.get('/usuarios', { params }).then((r) => r.data);

export const obtenerUsuario = (id) => cliente.get(`/usuarios/${id}`).then((r) => r.data);

// POST /usuarios  { nombre, usuario, password, rol, departamento_id }
// departamento_id es obligatorio para solicitante y responsable
export const crearUsuario = (datos) => cliente.post('/usuarios', datos).then((r) => r.data);

// PATCH /usuarios/:id  (enviar solo lo que cambia) { nombre, rol, departamento_id, password, estado }
// Para desactivar: { estado: 'inactivo' }
export const actualizarUsuario = (id, datos) => cliente.patch(`/usuarios/${id}`, datos).then((r) => r.data);
