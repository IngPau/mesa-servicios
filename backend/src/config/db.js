const mongoose = require('mongoose');

// Conecta con MongoDB (Atlas) usando el connection string del .env
async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB conectado (base de datos: ${mongoose.connection.name})`);
  } catch (err) {
    console.error('No se pudo conectar a MongoDB:', err.message);
    console.error('Revisa: 1) el connection string, 2) la contraseña, 3) Network Access (0.0.0.0/0) en Atlas.');
    process.exit(1);
  }
}

module.exports = conectarDB;
