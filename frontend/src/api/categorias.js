import cliente from './cliente';

// GET /categorias?departamento_id=&estado=  (los no administradores solo ven las activas)
// Cada categoría trae campos_especificos: [{ nombre, etiqueta, requerido }] para el formulario dinámico
export const listarCategorias = (params = {}) => cliente.get('/categorias', { params }).then((r) => r.data);

export const obtenerCategoria = (id) => cliente.get(`/categorias/${id}`).then((r) => r.data);

// Solo administrador:
// POST /categorias  { nombre, descripcion, departamento_id, campos_especificos }
export const crearCategoria = (datos) => cliente.post('/categorias', datos).then((r) => r.data);

// PATCH /categorias/:id  { nombre, descripcion, departamento_id, campos_especificos, estado }
export const actualizarCategoria = (id, datos) => cliente.patch(`/categorias/${id}`, datos).then((r) => r.data);
