const router = require('express').Router();
const c = require('../controllers/categoriaController');
const { autenticar } = require('../middlewares/auth');
const { permitir } = require('../middlewares/roles');

router.use(autenticar);

router.get('/', c.listar);
router.get('/:id', c.obtener);
router.post('/', permitir('administrador'), c.crear);
router.patch('/:id', permitir('administrador'), c.actualizar);

module.exports = router;
