import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// strictPort: el backend solo acepta peticiones desde http://localhost:5173 (CORS_ORIGIN).
// Si el puerto 5173 está ocupado, Vite avisará en vez de cambiarse a otro puerto.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
