require('dotenv').config();

const app = require('./src/app');
const conectarDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error('Faltan variables en el archivo .env (MONGODB_URI y JWT_SECRET). Revisa .env.example');
    process.exit(1);
  }
  await conectarDB();
  app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}/api/health`));
}

iniciar();
