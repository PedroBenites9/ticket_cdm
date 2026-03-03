import { useState, useEffect } from 'react';
import { toast } from 'sonner'; // 1. NUEVO: Importamos las notificaciones mágicas
import { motion } from 'framer-motion'; 

export default function Main({ cambiarVista, usuario }) {
  const [tickets, setTickets] = useState([]);
  
  // 2. NUEVO: El estado de carga. Empieza en "true" porque al abrir la app, no tenemos los datos aún.
  const [cargando, setCargando] = useState(true); 
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState({
    asunto: '', categoria: '', prioridad: 'Media', descripcion: ''
  });

  useEffect(() => {
    const obtenerTickets = async () => {
      try {
        const respuesta = await fetch('https://back-tickets-u01r.onrender.com/api/tickets');
        const datosReales = await respuesta.json();
        setTickets(datosReales);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al cargar los tickets desde la base de datos.");
      } finally {
        // 3. NUEVO: El bloque "finally" se ejecuta SIEMPRE al final, haya error o éxito.
        // Aquí apagamos el esqueleto de carga.
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

  const guardarTicket = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await fetch('https://back-tickets-u01r.onrender.com/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });
      const ticketCreado = await respuesta.json();
      
      setTickets([ticketCreado, ...tickets]);
      setMostrarModal(false);
      setFormulario({ asunto: '', categoria: '', prioridad: 'Media', descripcion: '' });
      
      // 4. NUEVO: Notificación de éxito al crear
      toast.success("¡Ticket generado correctamente!"); 
    } catch (error) {
      toast.error("Hubo un problema al crear el ticket.");
    }
  };

  const cambiarEstadoTicket = async (idTabla, nuevoEstado) => {
    try {
      await fetch(`https://back-tickets-u01r.onrender.com/api/tickets/${idTabla}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const ticketsActualizados = tickets.map((ticket) => {
        if (ticket.id === idTabla) return { ...ticket, estado: nuevoEstado };
        return ticket;
      });
      setTickets(ticketsActualizados);
      
      // Notificación de éxito al actualizar
      toast.success("Estado actualizado a: " + nuevoEstado);
    } catch (error) {
      toast.error("Error al cambiar el estado.");
    }
  };

  const eliminarTicket = async (idTabla) => {
    const confirmar = window.confirm("¿Estás seguro de eliminar este ticket?");
    if (confirmar) {
      try {
        await fetch(`https://back-tickets-u01r.onrender.com/api/tickets/${idTabla}`, { method: 'DELETE' });
        const ticketsRestantes = tickets.filter((ticket) => ticket.id !== idTabla);
        setTickets(ticketsRestantes);
        
        // Notificación de éxito al borrar
        toast.error("Ticket eliminado del sistema."); // Usamos .error para que salga rojo (como advertencia de borrado)
      } catch (error) {
        toast.error("Error al intentar eliminar.");
      }
    }
  };

  const ticketsFiltrados = tickets.filter((ticket) => 
  {

    ticket.asunto.toLowerCase().includes(busqueda.toLowerCase()) || 
    ticket.codigo.toLowerCase().includes(busqueda.toLowerCase())
  }
  );
      // Cálculos para el Panel de Estadísticas
  const totalTickets = tickets.length;
  const ticketsAbiertos = tickets.filter(t => t.estado === 'Abierto').length;
  const ticketsEnProceso = tickets.filter(t => t.estado === 'En Proceso').length;
  const ticketsResueltos = tickets.filter(t => t.estado === 'Resuelto').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
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
              localStorage.removeItem('nombre_usuario'); // <-- NUEVO: Limpiamos el nombre
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
          <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
            + Nuevo Ticket
          </button>
        </div>
        {/* PANEL DE ESTADÍSTICAS */}
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

        <div className="mb-3">
          <input type="text" className="form-control" placeholder="🔍 Buscar por Código o Asunto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        
        <div className="card shadow-sm">
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
                
                {/* 5. NUEVO: Lógica del Skeleton Loader */}
                {cargando ? (
                  // Si está cargando, dibujamos 3 filas de mentira con la clase "placeholder-glow" de Bootstrap
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
                  // Si NO está cargando y HAY tickets, los mostramos
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
                          <button className="btn btn-danger btn-sm" title="Eliminar" onClick={() => eliminarTicket(ticket.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Si NO está cargando y NO hay tickets, mostramos el mensaje vacío
                  <tr>
                    <td colSpan="7" className="text-muted py-3">No hay tickets registrados.</td>
                  </tr>
                )}
                
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reportar Incidencia o Tarea</h5>
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
                      {/* 6. NUEVO: Categorías adaptadas al mundo real */}
                      <label className="form-label">Categoría</label>
                      <select className="form-select" name="categoria" value={formulario.categoria} onChange={manejarCambio} required>
                        <option value="" disabled>Seleccione...</option>
                        <option value="CCTV y Seguridad">CCTV y Seguridad</option>
                        <option value="Sistemas de Alarmas">Sistemas de Alarmas</option>
                        <option value="Terminaciones">Terminaciones en Obra</option>
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
                  <button type="submit" className="btn btn-primary">Guardar Ticket</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}