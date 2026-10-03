const router = require('express').Router();
const c = require('../controllers/usuarioController');
const { autenticar } = require('../middlewares/auth');
const { permitir } = require('../middlewares/roles');

// Todo el módulo de usuarios es solo para el administrador (R7)
router.use(autenticar, permitir('administrador'));

router.get('/', c.listar);
router.post('/', c.crear);
router.get('/:id', c.obtener);
router.patch('/:id', c.actualizar);

module.exports = router;
