const express = require('express');
const cors = require('cors');
const { noEncontrada, manejarErrores } = require('./middlewares/errorHandler');

const app = express();

const origenes = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true;
app.use(cors({ origin: origenes }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, servicio: 'Mesa de Servicios Hospitalarios' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/departamentos', require('./routes/departamentoRoutes'));
app.use('/api/categorias', require('./routes/categoriaRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/reportes', require('./routes/reporteRoutes'));

app.use(noEncontrada);
app.use(manejarErrores);

module.exports = app;
