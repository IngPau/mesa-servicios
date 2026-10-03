import cliente from './cliente';

// POST /auth/login -> { token, usuario }
export const login = (usuario, password) =>
  cliente.post('/auth/login', { usuario, password }).then((r) => r.data);

// GET /auth/me -> usuario
export const me = () => cliente.get('/auth/me').then((r) => r.data);
