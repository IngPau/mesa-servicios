const router = require('express').Router();
const c = require('../controllers/reporteController');
const { autenticar } = require('../middlewares/auth');
const { permitir } = require('../middlewares/roles');

// R6: reportes e indicadores, solo para el administrador
router.use(autenticar, permitir('administrador'));

router.get('/resumen', c.resumen);
router.get('/exportar', c.exportar);

module.exports = router;
