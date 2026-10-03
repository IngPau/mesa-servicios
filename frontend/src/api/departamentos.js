import cliente from './cliente';

// GET /departamentos  (los no administradores solo ven los activos)
export const listarDepartamentos = (params = {}) => cliente.get('/departamentos', { params }).then((r) => r.data);

export const obtenerDepartamento = (id) => cliente.get(`/departamentos/${id}`).then((r) => r.data);

// Solo administrador:
// POST /departamentos  { nombre, descripcion }
export const crearDepartamento = (datos) => cliente.post('/departamentos', datos).then((r) => r.data);

// PATCH /departamentos/:id  { nombre, descripcion, estado }
export const actualizarDepartamento = (id, datos) => cliente.patch(`/departamentos/${id}`, datos).then((r) => r.data);
