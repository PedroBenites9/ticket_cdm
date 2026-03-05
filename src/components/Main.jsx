import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Main({ cambiarVista, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true); 
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null); 
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  const [formulario, setFormulario] = useState({
    asunto: '', categoria: '', prioridad: 'Media', descripcion: ''
  });

  const URL_API = 'https://back-tickets-u01r.onrender.com/api';
  
  // 1. NUEVO: Leemos el rol del usuario (si no hay, por seguridad es "final")
  const rolUsuario = localStorage.getItem('rol_usuario') || 'final';

  useEffect(() => {
    const obtenerTickets = async () => {
      try {
        const respuesta = await fetch(`${URL_API}/tickets`);
        const datosReales = await respuesta.json();
        setTickets(datosReales);
      } catch (error) {
        toast.error("Error al cargar los tickets.");
      } finally {
        setCargando(false);
      }
    };
    obtenerTickets();
  }, []);

  const obtenerColorEstado = (estado) => {
    if (estado === 'Abierto') return 'bg-danger';
    if (estado === 'En Proceso') return 'bg-warning text-dark';
    if (estado === 'Resuelto') return 'bg-success';
    return 'bg-secondary';
  };

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setFormulario({ asunto: '', categoria: '', prioridad: 'Media', descripcion: '' });
    setEditandoId(null);
    setMostrarModal(true);
  };

  const abrirModalEditar = (ticket) => {
    setFormulario({
      asunto: ticket.asunto,
      categoria: ticket.categoria,
      prioridad: ticket.prioridad,
      descripcion: ticket.descripcion
    });
    setEditandoId(ticket.id);
    setMostrarModal(true);
  };

  const guardarTicket = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        const respuesta = await fetch(`${URL_API}/tickets/editar/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formulario)
        });
        const ticketActualizado = await respuesta.json();
        const ticketsNuevos = tickets.map(t => t.id === editandoId ? ticketActualizado : t);
        setTickets(ticketsNuevos);
        toast.success("¡Ticket actualizado correctamente!");
      } else {
        const respuesta = await fetch(`${URL_API}/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formulario)
        });
        const ticketCreado = await respuesta.json();
        setTickets([ticketCreado, ...tickets]);
        toast.success("¡Ticket generado correctamente!"); 
      }
      setMostrarModal(false);
    } catch (error) {
      toast.error("Hubo un problema al procesar el ticket.");
    }
  };

  const cambiarEstadoTicket = async (idTabla, nuevoEstado) => {
    try {
      await fetch(`${URL_API}/tickets/${idTabla}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const ticketsActualizados = tickets.map((ticket) => {
        if (ticket.id === idTabla) return { ...ticket, estado: nuevoEstado };
        return ticket;
      });
      setTickets(ticketsActualizados);
      toast.success("Estado actualizado a: " + nuevoEstado);
    } catch (error) {
      toast.error("Error al cambiar el estado.");
    }
  };

  // 2. NUEVO: Función para que el técnico se asigne el ticket
  const asignarmeTicket = async (idTabla) => {
    try {
      // Nota: Esta ruta la crearemos en el Backend en el próximo paso
      await fetch(`${URL_API}/tickets/asignar/${idTabla}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tecnico: usuario })
      });
      const ticketsActualizados = tickets.map((t) =>
        t.id === idTabla ? { ...t, tecnico_asignado: usuario } : t
      );
      setTickets(ticketsActualizados);
      toast.success("Te has asignado este ticket.");
    } catch (error) {
      toast.error("Error al asignarse el ticket.");
    }
  };

  const eliminarTicket = async (idTabla) => {
    const confirmar = window.confirm("¿Estás seguro de eliminar este ticket?");
    if (confirmar) {
      try {
        const respuesta = await fetch(`${URL_API}/tickets/${idTabla}`, { method: 'DELETE' });
        if (!respuesta.ok) throw new Error("Fallo en servidor");
        
        const ticketsRestantes = tickets.filter((ticket) => ticket.id !== idTabla);
        setTickets(ticketsRestantes);
        toast.error("Ticket eliminado del sistema."); 
      } catch (error) {
        toast.error("Error al intentar eliminar.");
      }
    }
  };

  const ticketsFiltrados = tickets.filter((ticket) => {
    const coincideTexto = ticket.asunto.toLowerCase().includes(busqueda.toLowerCase()) || 
                          (ticket.codigo && ticket.codigo.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideCategoria = filtroCategoria === 'Todas' || ticket.categoria === filtroCategoria;
    return coincideTexto && coincideCategoria;
  });

  const totalTickets = tickets.length;
  const ticketsAbiertos = tickets.filter(t => t.estado === 'Abierto').length;
  const ticketsEnProceso = tickets.filter(t => t.estado === 'En Proceso').length;
  const ticketsResueltos = tickets.filter(t => t.estado === 'Resuelto').length;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <header className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container">
          <span className="navbar-brand">
            <strong>🔧 Gestión de Obras</strong>
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light d-none d-md-inline">
              Hola, <strong>{usuario}</strong> <span className="badge bg-secondary ms-1">{rolUsuario.toUpperCase()}</span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={() => {
              localStorage.removeItem('token_acceso'); 
              localStorage.removeItem('nombre_usuario');
              localStorage.removeItem('rol_usuario'); // Limpiamos el rol al salir
              cambiarVista('login');
            }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h3 text-secondary">Mis Incidencias</h2>
          <button className="btn btn-primary" onClick={abrirModalCrear}>
            + Nuevo Ticket
          </button>
        </div>

        {/* 3. NUEVO: Solo el Administrador ve las tarjetas de conteo */}
        {rolUsuario === 'admin' && (
          <div className="row mb-4">
            <div className="col-md-3 col-6 mb-3">
              <div className="card bg-secondary text-white text-center shadow-sm h-100 border-0">
                <div className="card-body py-3">
                  <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Total</h6>
                  <h3 className="mb-0 fw-bold">{totalTickets}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="card bg-danger text-white text-center shadow-sm h-100 border-0">
                <div className="card-body py-3">
                  <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Abiertos</h6>
                  <h3 className="mb-0 fw-bold">{ticketsAbiertos}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="card bg-warning text-dark text-center shadow-sm h-100 border-0">
                <div className="card-body py-3">
                  <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>En Proceso</h6>
                  <h3 className="mb-0 fw-bold">{ticketsEnProceso}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="card bg-success text-white text-center shadow-sm h-100 border-0">
                <div className="card-body py-3">
                  <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Resueltos</h6>
                  <h3 className="mb-0 fw-bold">{ticketsResueltos}</h3>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className={`btn btn-sm ${filtroCategoria === 'Todas' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFiltroCategoria('Todas')}>Todas</button>
          <button className={`btn btn-sm ${filtroCategoria === 'CCTV y Seguridad' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFiltroCategoria('CCTV y Seguridad')}>📹 CCTV y Alarmas</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Terminaciones' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setFiltroCategoria('Terminaciones')}>🧱 Terminaciones</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Hardware e Insumos' ? 'btn-info text-white' : 'btn-outline-info'}`} onClick={() => setFiltroCategoria('Hardware e Insumos')}>💻 Hardware</button>
        </div>

        <div className="mb-3">
          <input type="text" className="form-control" placeholder="🔍 Buscar por Código o Asunto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        
        <div className="card shadow-sm">
          <div className="card-body p-0 table-responsive">
            <table className="table table-hover mb-0 text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Asunto</th>
                  <th>Categoría</th>
                  <th>Prioridad</th>
                  {/* Nueva columna */}
                  <th>Técnico Asignado</th> 
                  <th>Estado</th>
                  <th>Acciones</th> 
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="7">Cargando...</td></tr>
                ) : ticketsFiltrados.length > 0 ? (
                  ticketsFiltrados.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="fw-bold">{ticket.codigo}</td>
                      <td>{ticket.asunto}</td>
                      <td>{ticket.categoria}</td>
                      <td>{ticket.prioridad}</td>
                      
                      {/* Mostramos quién es el técnico */}
                      <td><span className="badge bg-light text-dark border">{ticket.tecnico_asignado || 'Sin asignar'}</span></td>
                      
                      <td><span className={`badge ${obtenerColorEstado(ticket.estado)}`}>{ticket.estado}</span></td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          
                          {/* 4. REGLAS DE ACCESO (RBAC) */}
                          
                          {/* El select de Estado solo lo ven Técnicos y Admins */}
                          {(rolUsuario === 'tecnico' || rolUsuario === 'admin') && (
                            <select className="form-select form-select-sm" style={{ width: '110px' }} value={ticket.estado} onChange={(e) => cambiarEstadoTicket(ticket.id, e.target.value)}>
                              <option value="Abierto">Abierto</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Resuelto">Resuelto</option>
                            </select>
                          )}

                          {/* Botón Asignarme: Solo Técnicos y Admins */}
                          {(rolUsuario === 'tecnico' || rolUsuario === 'admin') && (
                            <button className="btn btn-info btn-sm text-white" title="Asignarme a mí" onClick={() => asignarmeTicket(ticket.id)}>🙋‍♂️</button>
                          )}

                          {/* Lápiz de Edición: Finales y Admins */}
                          {(rolUsuario === 'final' || rolUsuario === 'admin') && (
                            <button className="btn btn-warning btn-sm text-white" title="Editar" onClick={() => abrirModalEditar(ticket)}>✏️</button>
                          )}

                          {/* Basurero: Estrictamente para Admins */}
                          {rolUsuario === 'admin' && (
                            <button className="btn btn-danger btn-sm" title="Eliminar" onClick={() => eliminarTicket(ticket.id)}>🗑️</button>
                          )}
                          
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted py-3">No hay tickets registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* EL MODAL DE CREACIÓN / EDICIÓN QUEDA IGUAL (Lo omito aquí por brevedad, no olvides mantenerlo en tu código) */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* ... Todo tu código del modal original ... */}
        </div>
      )}
    </motion.div>
  )
}