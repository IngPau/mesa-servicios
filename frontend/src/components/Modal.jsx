// Ventana emergente reutilizable (se cierra con Esc o con la X).
// Uso: <Modal titulo="Nuevo usuario" onCerrar={cerrar}> ...formulario... </Modal>
import './Modal.css';
import { useEffect } from 'react';

export default function Modal({ titulo, onCerrar, ancho = false, children }) {
  useEffect(() => {
    const alPulsar = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div className="modal-fondo">
      <div className={`modal${ancho ? ' modal--ancho' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <div className="modal__encabezado">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
