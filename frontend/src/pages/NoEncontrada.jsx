import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <div>
      <h1>Página no encontrada</h1>
      <Link to="/tickets">Volver al inicio</Link>
    </div>
  );
}
