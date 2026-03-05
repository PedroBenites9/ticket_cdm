import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Main({ cambiarVista, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true); 
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null); 

  const [busqueda, setBusqueda] = useState('');
  
  // 1. NUEVO: Estado para saber qué categoría estamos mirando (por defecto "Todas")
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  const [formulario, setFormulario] = useState({
    asunto: '', categoria: '', prioridad: 'Media', descripcion: ''
  });

  const URL_API = 'https://back-tickets-u01r.onrender.com/api';

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

  const eliminarTicket = async (idTabla) => {
    const confirmar = window.confirm("¿Estás seguro de eliminar este ticket?");
    if (confirmar) {
      try {
        await fetch(`${URL_API}/tickets/${idTabla}`, { method: 'DELETE' });
        const ticketsRestantes = tickets.filter((ticket) => ticket.id !== idTabla);
        setTickets(ticketsRestantes);
        toast.error("Ticket eliminado del sistema."); 
      } catch (error) {
        toast.error("Error al intentar eliminar.");
      }
    }
  };

  // 2. NUEVO: Lógica combinada. Filtra por texto (buscador) Y ADEMÁS por el botón que tocaste
  const ticketsFiltrados = tickets.filter((ticket) => {
    const coincideTexto = ticket.asunto.toLowerCase().includes(busqueda.toLowerCase()) || 
                          ticket.codigo.toLowerCase().includes(busqueda.toLowerCase());
                          
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
            <strong>🔧 Gestión de Obras y Soporte</strong>
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light d-none d-md-inline">
              Hola, <strong>{usuario}</strong> 👋
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={() => {
              localStorage.removeItem('token_acceso'); 
              localStorage.removeItem('nombre_usuario');
              cambiarVista('login');
            }}>
              Cerrar Sesión
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

        {/* 3. NUEVO: Los botones de filtro rápido */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button 
            className={`btn btn-sm ${filtroCategoria === 'Todas' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => setFiltroCategoria('Todas')}
          >
            Todas
          </button>
          <button 
            className={`btn btn-sm ${filtroCategoria === 'CCTV y Seguridad' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFiltroCategoria('CCTV y Seguridad')}
          >
            📹 CCTV y Alarmas
          </button>
          <button 
            className={`btn btn-sm ${filtroCategoria === 'Redes' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={() => setFiltroCategoria('Redes')}
          >
            🛜 Redes
          </button>
          <button 
            className={`btn btn-sm ${filtroCategoria === 'Hardware e Insumos' ? 'btn-info text-white' : 'btn-outline-info'}`}
            onClick={() => setFiltroCategoria('Hardware e Insumos')}
          >
            💻 Hardware
          </button>
        </div>

        <div className="mb-3">
          <input type="text" className="form-control" placeholder="🔍 Buscar por Código o Asunto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        
        <div className="card shadow-sm">
          {/* ... LA TABLA QUEDA EXACTAMENTE IGUAL ... */}
          <div className="card-body p-0">
            <table className="table table-hover mb-0 text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Asunto</th>
                  <th>Categoría</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th> 
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={index} className="placeholder-glow">
                      <td><span className="placeholder col-8 bg-secondary"></span></td>
                      <td><span className="placeholder col-10 bg-secondary"></span></td>
                      <td><span className="placeholder col-8 bg-secondary"></span></td>
                      <td><span className="placeholder col-6 bg-secondary"></span></td>
                      <td><span className="placeholder col-8 bg-secondary"></span></td>
                      <td><span className="placeholder col-8 bg-secondary"></span></td>
                      <td><span className="placeholder col-12 bg-secondary"></span></td>
                    </tr>
                  ))
                ) : ticketsFiltrados.length > 0 ? (
                  ticketsFiltrados.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="fw-bold">{ticket.codigo}</td>
                      <td>{ticket.asunto}</td>
                      <td>{ticket.categoria}</td>
                      <td>{ticket.prioridad}</td>
                      <td><span className={`badge ${obtenerColorEstado(ticket.estado)}`}>{ticket.estado}</span></td>
                      <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <select className="form-select form-select-sm" style={{ width: '110px' }} value={ticket.estado} onChange={(e) => cambiarEstadoTicket(ticket.id, e.target.value)}>
                            <option value="Abierto">Abierto</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Resuelto">Resuelto</option>
                          </select>
                          <button className="btn btn-warning btn-sm text-white" title="Editar" onClick={() => abrirModalEditar(ticket)}>✏️</button>
                          <button className="btn btn-danger btn-sm" title="Eliminar" onClick={() => eliminarTicket(ticket.id)}>🗑️</button>
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

      {/* EL MODAL DE CREACIÓN / EDICIÓN QUEDA EXACTAMENTE IGUAL */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editandoId ? "Editar Ticket" : "Reportar Incidencia o Tarea"}</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              
              <form onSubmit={guardarTicket}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Asunto breve</label>
                    <input type="text" className="form-control" name="asunto" value={formulario.asunto} onChange={manejarCambio} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Categoría</label>
                      <select className="form-select" name="categoria" value={formulario.categoria} onChange={manejarCambio} required>
                        <option value="" disabled>Seleccione...</option>
                        <option value="CCTV y Seguridad">CCTV y Seguridad</option>
                        <option value="Sistemas de Alarmas">Sistemas de Alarmas</option>
                        <option value="Redes">Redes</option>
                        <option value="Hardware e Insumos">Hardware e Insumos</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prioridad</label>
                      <select className="form-select" name="prioridad" value={formulario.prioridad} onChange={manejarCambio}>
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción detallada</label>
                    <textarea className="form-control" rows="3" name="descripcion" value={formulario.descripcion} onChange={manejarCambio} required></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editandoId ? "Actualizar Cambios" : "Guardar Ticket"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
} 