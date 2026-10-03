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
