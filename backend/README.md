# Backend – Mesa de Servicios Hospitalarios

API REST con **Node.js + Express** y **MongoDB** (Mongoose). Autenticación con **JWT** y contraseñas cifradas con **bcrypt**.

## Cómo correrlo

1. `npm install`
2. Copia `.env.example` a `.env` y completa `MONGODB_URI` (connection string de Atlas con la contraseña real y `/mesa_servicios`) y `JWT_SECRET`.
3. `npm run seed` → crea departamentos, categorías y usuarios de prueba. **Borra todo lo que haya en la base.**
4. `npm run dev` → `http://localhost:3000/api/health` debe responder `{ "ok": true }`.

Usuarios de prueba (contraseña de todos: `Clave123`):

| usuario | rol | departamento |
|---|---|---|
| admin | administrador | — |
| juan | solicitante | Recepción |
| sofia | solicitante | Enfermería |
| carlos | responsable | Informática |
| ana | responsable | Mantenimiento |

Para probar todo el flujo importa `postman/mesa-servicios.postman_collection.json` en Postman y ejecuta las carpetas **0** y **1** en orden (Runner). Cada petición trae pruebas automáticas.

## MongoDB en 1 minuto

| SQL | MongoDB |
|---|---|
| Tabla | **Colección** |
| Fila | **Documento** (parecido a un objeto JSON) |
| Columna | **Campo** |

Un ticket es **un solo documento** que lleva dentro sus `comentarios` y su `historial` (en SQL serían 3 tablas con JOIN). Además, el campo `datos_especificos` puede tener campos distintos según la categoría (Informática guarda `tipo_equipo`, Mantenimiento guarda `area_afectada`) sin modificar ninguna estructura: es lo que piden **R1 y RNF4**.

## Colecciones

| Colección | Qué guarda |
|---|---|
| `departamentos` | nombre, descripción, estado |
| `usuarios` | nombre, usuario, password (hash), rol, departamento_id, estado |
| `categorias` | nombre, departamento_id (departamento encargado), `campos_especificos` (qué datos extra pide el formulario), estado |
| `tickets` | código, título, descripción, ubicación, categoría, departamento, solicitante, responsable, prioridad, estado, `datos_especificos`, solución, fechas, `comentarios[]`, `historial[]` |
| `counters` | contador interno para generar `TK-000001`, `TK-000002`… |

## Mapa de archivos

```
server.js                    arranca la API
src/app.js                   configura Express y registra las rutas
src/config/                  conexión a MongoDB y constantes (roles, estados, prioridades)
src/models/                  esquemas de las colecciones (Mongoose)
src/middlewares/auth.js      verifica el token JWT (RNF2, RN-03)
src/middlewares/roles.js     limita rutas por rol
src/middlewares/errorHandler.js   respuestas de error uniformes
src/routes/                  qué URL llama a qué controlador
src/controllers/             reciben la petición y responden
src/services/ticketService.js    TODAS las reglas de negocio de los tickets
src/seed.js                  datos de prueba
postman/                     colección de pruebas
```

## Endpoints

Todos (excepto login y health) requieren el header `Authorization: Bearer <token>`.

| Método y ruta | Quién | Para qué | Req. |
|---|---|---|---|
| `POST /api/auth/login` | todos | Iniciar sesión, devuelve token | RNF2 |
| `GET /api/auth/me` | autenticado | Datos del usuario actual | |
| `GET/POST /api/usuarios`, `GET/PATCH /api/usuarios/:id` | administrador | Crear, editar, activar/desactivar usuarios | R7 |
| `GET /api/departamentos`, `GET /api/categorias` | autenticado | Consultar (solicitantes ven solo activos) | |
| `POST/PATCH /api/departamentos`, `/api/categorias` | administrador | Administrar catálogos | |
| `GET /api/tickets/duplicados?categoria_id=&ubicacion=` | solicitante, admin | Verificar duplicados antes de crear | R5 |
| `POST /api/tickets` | solicitante, admin | Crear ticket (`forzar: true` si no es duplicado) | R1, R5 |
| `GET /api/tickets` | autenticado | Listar/buscar según el rol | R4 |
| `GET /api/tickets/:id` | autenticado | Detalle con historial (acepta `TK-000001`) | R3, R4 |
| `PATCH /api/tickets/:id/asignar` | administrador | Asignar responsable | R2 |
| `PATCH /api/tickets/:id/estado` | según transición | Avanzar estado | R3 |
| `POST /api/tickets/:id/comentarios` | relacionados | Agregar comentario | RN-16 |

Filtros de `GET /api/tickets`: `codigo`, `estado`, `prioridad`, `categoria_id`, `departamento_id`, `desde`, `hasta` (AAAA-MM-DD), `asignado_a_mi=true`, `pagina`, `limite`.

Valores válidos — estados: `pendiente, asignado, en_proceso, resuelto, cerrado`; prioridades: `baja, media, alta, critica`; roles: `solicitante, responsable, administrador`.

## Flujo del ticket y quién puede hacer cada paso

```
pendiente --(admin asigna)--> asignado --(responsable)--> en_proceso --(responsable, con solución)--> resuelto --(solicitante dueño o admin)--> cerrado
```

Saltar pasos o retroceder devuelve error `409` indicando el flujo correcto. Un ticket cerrado ya no cambia de estado.

## Dónde está cada requerimiento

| Requerimiento | Dónde |
|---|---|
| R1 Registrar solicitud | `ticketService.crearTicket` |
| R2 Asignar | `ticketService.asignarResponsable` |
| R3 Estado e historial | `ticketService.cambiarEstado`, `validarTransicion`, campo `historial` |
| R4 Consultar y filtrar | `ticketService.listarTickets` |
| R5 Duplicados | `ticketService.buscarDuplicados` + `forzar` en `crearTicket` |
| R6 Reportes | **pendiente (siguiente entrega)** |
| R7 Usuarios y roles | `usuarioController`, `middlewares/roles.js` |
| RNF1 Tiempos | índices en `models/Ticket.js`, paginación |
| RNF2 Seguridad | JWT + bcrypt + `middlewares/auth.js` |
| RNF4 Esquema flexible | `datos_especificos` (tipo Mixed) y `campos_especificos` de la categoría |

## Decisiones asumidas (confirmar con el equipo)

- El **responsable** ve los tickets de su departamento, pero solo el **responsable asignado** (o el admin) puede cambiar su estado.
- Los **comentarios** se permiten también en tickets cerrados; el estado y los datos principales no cambian.
- Solo se puede asignar un ticket en estado `pendiente` (no hay reasignación en esta versión).
- Solicitantes y responsables deben tener departamento; el administrador no.
- El duplicado (R5) se detecta por **misma categoría + misma ubicación** (sin distinguir mayúsculas) con ticket en `pendiente`, `asignado` o `en_proceso`.
- No hay borrado de datos: se **desactivan** usuarios, departamentos y categorías.
- HTTPS (RNF2) y disponibilidad (RNF3) son requisitos de despliegue; en desarrollo se usa HTTP.
