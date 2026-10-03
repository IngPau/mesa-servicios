import './NoEncontrada.css';
import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <div className="no-encontrada">
      <p className="no-encontrada__codigo">404</p>
      <h1>Página no encontrada</h1>
      <p className="no-encontrada__texto">
        La dirección que buscas no existe o fue movida. Revisa el enlace o regresa a tus solicitudes.
      </p>
      <Link className="btn" to="/tickets">Volver a las solicitudes</Link>
    </div>
  );
}