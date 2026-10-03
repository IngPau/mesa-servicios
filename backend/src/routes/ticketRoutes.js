const router = require('express').Router();
const c = require('../controllers/ticketController');
const { autenticar } = require('../middlewares/auth');
const { permitir } = require('../middlewares/roles');

router.use(autenticar);

// Importante: "/duplicados" va antes de "/:id", si no Express lo confundiría con un id
router.get('/duplicados', permitir('solicitante', 'administrador'), c.duplicados);

router.get('/', c.listar); // el contenido depende del rol
router.post('/', permitir('solicitante', 'administrador'), c.crear);
router.get('/:id', c.obtener);
router.patch('/:id/asignar', permitir('administrador'), c.asignar);
router.patch('/:id/estado', c.cambiarEstado); // el servicio valida rol y propiedad según la transición
router.post('/:id/comentarios', c.comentar);

module.exports = router;
