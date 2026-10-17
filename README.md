# Mesa de Servicios Hospitalarios

Aplicación web para registrar, asignar, atender y dar seguimiento a las solicitudes internas de un hospital.

- `backend/` → API REST (Node.js + Express + MongoDB). **Ver `backend/README.md`.**
- `frontend/` → React (se creará en la siguiente fase).

## Inicio rápido

```bash
cd backend
npm install
cp .env.example .env     # en Windows: copy .env.example .env   (y luego edita .env)
npm run seed             # carga datos de prueba (BORRA la base de datos)
npm run dev              # API en http://localhost:3000
```

## Despliegue en Railway (backend + frontend)

Se crean **2 servicios** dentro del mismo proyecto de Railway, ambos desde este repositorio.

### 0. Base de datos (MongoDB Atlas)
1. En Atlas → Network Access → agregar `0.0.0.0/0` (Railway no tiene IP fija).
2. Copia el connection string y agrégale `/mesa_servicios` antes del `?`.
3. Cargar datos de prueba (una sola vez, desde tu PC): en `backend/` crea `.env` con ese `MONGODB_URI` y ejecuta `npm install` y `npm run seed`.

### 1. Servicio backend
- New Project → Deploy from GitHub repo → este repo.
- Settings → **Root Directory**: `/backend`
- Variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=8h`, `CORS_ORIGIN` (se llena en el paso 3).
- Settings → Networking → **Generate Domain**. Prueba `https://TU-BACKEND.up.railway.app/api/health`.

### 2. Servicio frontend
- En el mismo proyecto: + New → GitHub Repo → este repo otra vez.
- Settings → **Root Directory**: `/frontend`
- Variables: `VITE_API_URL=https://TU-BACKEND.up.railway.app/api` (debe existir ANTES del build; si la cambias, redespliega).
- Build: `npm run build` · Start: `npm start` (Railway los detecta solo).
- Settings → Networking → **Generate Domain**.

### 3. Conectar los dos
- En el backend, `CORS_ORIGIN=https://TU-FRONTEND.up.railway.app` (sin `/` al final) → se redespliega solo.
- Entra al dominio del frontend
