// Página de inicio: bienvenida, resumen rápido y accesos (cuadros) a cada módulo según el rol.
//
// Cómo funciona (para la defensa):
//  - Los cuadros se filtran con el rol del usuario: cada uno declara qué roles lo ven.
//  - El resumen usa la misma API del listado (GET /tickets) pidiendo solo 1 registro por estado:
//    lo que interesa es el "total" que devuelve. Como la API ya limita por rol, cada usuario ve
//    sus propios números (solicitante: los suyos; responsable: su departamento; admin: todos).
import './Inicio.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarTickets } from '../api/tickets';
import { ETIQUETAS_ROL } from '../utils/constantes';

const ICONOS = {
  lista: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
  nueva: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></>,
  bandeja: <><path d="M4 13l2.5-8h11L20 13v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
  usuarios: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4.5a3 3 0 010 6M21 20c0-2.6-1.6-4.8-4-5.6" /></>,
  departamentos: <><rect x="3" y="8" width="7" height="13" /><rect x="10" y="3" width="11" height="18" /><path d="M13 7h2M17 7h1M13 11h2M17 11h1M13 15h2M17 15h1M5.5 12h2M5.5 16h2" /></>,
  categorias: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8" r="1.4" /></>,
  reportes: <><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>,
};

function Icono({ nombre }) {
  return (
    <svg className="modulo__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[nombre]}
    </svg>
  );
}

const MODULOS = [
  { a: '/tickets', icono: 'lista', titulo: 'Solicitudes', texto: 'Consulte, filtre y dé seguimiento a las solicitudes.', roles: ['solicitante', 'responsable', 'administrador'] },
  { a: '/tickets/nuevo', icono: 'nueva', titulo: 'Nueva solicitud', texto: 'Reporte un problema y envíelo al departamento que lo atiende.', roles: ['solicitante', 'administrador'] },
  { a: '/tickets', icono: 'bandeja', titulo: 'Mi bandeja de trabajo', texto: 'En Solicitudes marque "Asignados a mí" para ver lo que le toca atender.', roles: ['responsable'] },
  { a: '/reportes', icono: 'reportes', titulo: 'Reportes', texto: 'Indicadores, tiempos promedio de atención y exportación a Excel.', roles: ['administrador'] },
  { a: '/admin/usuarios', icono: 'usuarios', titulo: 'Usuarios', texto: 'Cree cuentas, asigne roles y active o desactive el acceso.', roles: ['administrador'] },
  { a: '/admin/departamentos', icono: 'departamentos', titulo: 'Departamentos', texto: 'Áreas del hospital que atienden solicitudes.', roles: ['administrador'] },
  { a: '/admin/categorias', icono: 'categorias', titulo: 'Categorías', texto: 'Tipos de solicitud y los datos que pide cada uno.', roles: ['administrador'] },
];

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Inicio() {
  const { usuario } = useAuth();
  const [conteo, setConteo] = useState(null);

  useEffect(() => {
    let vigente = true;
    const total = (estado) => listarTickets({ estado, limite: 1 }).then((r) => r.total).catch(() => null);
    Promise.all(['pendiente', 'asignado', 'en_proceso', 'resuelto'].map(total)).then(([pendiente, asignado, enProceso, resuelto]) => {
      if (!vigente) return;
      const suma = (a, b) => (a === null || b === null ? null : a + b);
      setConteo({ pendiente, atencion: suma(asignado, enProceso), resuelto });
    });
    return () => { vigente = false; };
  }, []);

  const modulos = MODULOS.filter((m) => m.roles.includes(usuario.rol));
  const alcance = { solicitante: 'Sus solicitudes', responsable: `Solicitudes de ${usuario.departamento_id?.nombre || 'su departamento'}`, administrador: 'Todas las solicitudes del hospital' }[usuario.rol];
  const textoFecha = new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fecha = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);

  return (
    <div className="inicio">
      <section className="inicio__portada">
        <img src="/logo2.png" alt="" className="inicio__logo" />
        <div>
          <p className="inicio__fecha">{fecha}</p>
          <h1>Hospital Santa Cruz</h1>
          <p className="inicio__subtitulo">Mesa de Servicios · {saludo()}, {usuario.nombre.split(' ')[0]}</p>
          <p className="inicio__rol">{ETIQUETAS_ROL[usuario.rol]}{usuario.departamento_id ? ` · ${usuario.departamento_id.nombre}` : ''}</p>
        </div>
      </section>

      <section aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo" className="inicio__seccion">Resumen <span>{alcance}</span></h2>
        <div className="inicio__resumen">
          <Link to="/tickets" className="resumen resumen--pendiente">
            <strong>{conteo?.pendiente ?? '—'}</strong><span>Pendientes de asignar</span>
          </Link>
          <Link to="/tickets" className="resumen resumen--atencion">
            <strong>{conteo?.atencion ?? '—'}</strong><span>En atención</span>
          </Link>
          <Link to="/tickets" className="resumen resumen--resuelto">
            <strong>{conteo?.resuelto ?? '—'}</strong><span>Resueltas, por cerrar</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="modulos-titulo">
        <h2 id="modulos-titulo" className="inicio__seccion">Módulos</h2>
        <div className="modulos">
          {modulos.map((m) => (
            <Link key={m.titulo} to={m.a} className="modulo">
              <Icono nombre={m.icono} />
              <span className="modulo__titulo">{m.titulo}</span>
              <span className="modulo__texto">{m.texto}</span>
              <span className="modulo__ir" aria-hidden="true">Abrir →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
