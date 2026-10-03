// Carga datos de prueba. ¡Borra todo el contenido actual de la base de datos!
// Uso: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Departamento = require('./models/Departamento');
const Usuario = require('./models/Usuario');
const Categoria = require('./models/Categoria');
const Ticket = require('./models/Ticket');
const Counter = require('./models/Counter');

const PASSWORD = 'Clave123';

const departamentos = [
  'Enfermería', 'Farmacia', 'Laboratorio', 'Mantenimiento', 'Informática', 'Administración', 'Recepción',
];

// departamento -> categorías (con campos específicos opcionales para el formulario dinámico)
const categorias = {
  Informática: [
    { nombre: 'Problemas de equipos', campos: [
      { nombre: 'tipo_equipo', etiqueta: 'Tipo de equipo', requerido: true },
      { nombre: 'numero_serie', etiqueta: 'Número de serie', requerido: false },
    ] },
    { nombre: 'Redes e internet', campos: [] },
    { nombre: 'Software y sistemas', campos: [] },
    { nombre: 'Cuentas y accesos', campos: [] },
  ],
  Mantenimiento: [
    { nombre: 'Electricidad', campos: [{ nombre: 'area_afectada', etiqueta: 'Área afectada', requerido: true }] },
    { nombre: 'Plomería', campos: [{ nombre: 'area_afectada', etiqueta: 'Área afectada', requerido: true }] },
    { nombre: 'Aire acondicionado', campos: [] },
    { nombre: 'Mobiliario', campos: [] },
  ],
  Enfermería: [{ nombre: 'Insumos de enfermería', campos: [] }, { nombre: 'Equipo de enfermería', campos: [] }],
  Farmacia: [{ nombre: 'Pedido de medicamentos', campos: [] }, { nombre: 'Desabasto de medicamentos', campos: [] }],
  Laboratorio: [{ nombre: 'Reactivos e insumos', campos: [] }, { nombre: 'Equipo de laboratorio', campos: [] }],
  Administración: [{ nombre: 'Trámites administrativos', campos: [] }, { nombre: 'Solicitud de materiales', campos: [] }],
};

// [nombre, usuario, rol, departamento]
const usuarios = [
  ['Administrador del Sistema', 'admin', 'administrador', null],
  ['Juan Pérez', 'juan', 'solicitante', 'Recepción'],
  ['Sofía López', 'sofia', 'solicitante', 'Enfermería'],
  ['Carlos Méndez', 'carlos', 'responsable', 'Informática'],
  ['Ana Ramírez', 'ana', 'responsable', 'Mantenimiento'],
];

async function sembrar() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI en el archivo .env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Conectado a: ${mongoose.connection.name}`);

  await Promise.all([Ticket, Categoria, Usuario, Departamento, Counter].map((m) => m.deleteMany({})));

  const deps = {};
  for (const nombre of departamentos) deps[nombre] = await Departamento.create({ nombre });

  for (const [depNombre, lista] of Object.entries(categorias)) {
    for (const c of lista) {
      await Categoria.create({ nombre: c.nombre, departamento_id: deps[depNombre]._id, campos_especificos: c.campos });
    }
  }

  // save() uno por uno para que se cifre la contraseña
  for (const [nombre, usuario, rol, dep] of usuarios) {
    await new Usuario({ nombre, usuario, password: PASSWORD, rol, departamento_id: dep ? deps[dep]._id : null }).save();
  }

  console.log('\nDatos de prueba creados. Usuarios (contraseña para todos: %s):', PASSWORD);
  usuarios.forEach(([nombre, usuario, rol, dep]) => console.log(`  ${usuario.padEnd(8)} ${rol.padEnd(14)} ${dep || '-'}  (${nombre})`));
}

sembrar()
  .catch((err) => { console.error('Error en el seed:', err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
