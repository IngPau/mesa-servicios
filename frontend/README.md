# Frontend – Mesa de Servicios Hospitalarios

React + Vite + React Router + Axios. **Es solo el esqueleto**: la sesión, las rutas protegidas y el cliente de la API ya funcionan; las pantallas están vacías con instrucciones (`TODO`) de lo que debe hacer cada una. Todavía no hay estilos.

## Cómo correrlo

```bash
cd frontend
npm install
copy .env.example .env      # Windows
npm run dev                 # http://localhost:5173
```

El backend debe estar corriendo (`npm run dev` en `/backend`). Para entrar usa un usuario de prueba, por ejemplo `admin` / `Clave123` (lista completa en `docs/CONTEXTO_PROYECTO_Y_API.md`).

## Estructura

```
src/
├─ main.jsx                 punto de entrada (Router + sesión)
├─ App.jsx                  mapa de rutas  <- registra aquí las pantallas nuevas
├─ api/                     TODAS las llamadas al backend (una función por endpoint)
│  ├─ cliente.js            axios: URL base, token automático, manejo de 401, mensajeDeError()
│  ├─ auth.js  tickets.js  usuarios.js  departamentos.js  categorias.js
├─ context/
│  └─ AuthContext.jsx       sesión: useAuth() -> { usuario, cargando, login, logout }
├─ components/              piezas reutilizables
│  ├─ RutaProtegida.jsx     exige sesión y (opcional) rol
│  ├─ Layout.jsx            menú según rol + contenido
│  └─ BadgeEstado, BadgePrioridad, Historial, Comentarios
├─ pages/
│  ├─ Login.jsx             (versión básica funcional)
│  ├─ Tickets.jsx  TicketDetalle.jsx  NuevoTicket.jsx
│  ├─ NoEncontrada.jsx
│  └─ admin/  Usuarios.jsx  Departamentos.jsx  Categorias.jsx
└─ utils/
   ├─ constantes.js         roles, estados, prioridades y sus etiquetas en español
   ├─ permisos.js           qué acciones puede ver cada usuario sobre un ticket
   └─ formato.js            formatearFecha()
```

## Rutas

| Ruta | Pantalla | Quién |
|---|---|---|
| `/login` | Login | público |
| `/tickets` | Listado | todos |
| `/tickets/nuevo` | Nuevo ticket | solicitante, administrador |
| `/tickets/:id` | Detalle | todos |
| `/admin/usuarios`, `/admin/departamentos`, `/admin/categorias` | Administración | administrador |

## Convenciones

- **Las pantallas nunca usan `axios` directamente**: siempre llaman a las funciones de `src/api/`.
- Para mostrar un error al usuario: `mensajeDeError(error)` (el backend ya responde en español). Para el detalle (`duplicados`, `campos_faltantes`): `datosDeError(error)`.
- Para saber quién está logueado: `const { usuario } = useAuth()` (`usuario._id`, `nombre`, `rol`, `departamento_id`).
- Para decidir qué botones mostrar en un ticket: funciones de `utils/permisos.js`.
- Textos en español. Fechas con `formatearFecha()`.
- Cada página es de **un módulo/persona**: el encabezado de cada archivo tiene "Módulo asignado a: ____". Escribe ahí el nombre al empezar.
- Si necesitas modificar un archivo compartido (`App.jsx`, `Layout.jsx`, `api/cliente.js`, `AuthContext.jsx`), avisa al equipo y haz ese cambio en un PR pequeño.

## Decisiones pendientes del equipo

- **Estilos:** CSS normal, Tailwind o una librería de componentes (MUI, etc.). Elijan **una** y úsenla todos.
- **Reportes (R6):** no hay endpoints todavía, por eso no existe esa pantalla.
