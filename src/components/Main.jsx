import { useState, useEffect, useRef } from 'react';

import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Main({ cambiarVista, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true); 
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null); 
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  // ==========================================
  // NUEVO (BITÁCORA): Estados para los comentarios
  // ==========================================
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
// ==========================================
  // MAGIA DEL CHAT: Referencia y Tiempo Real
  // ==========================================
  const finalDelChatRef = useRef(null); // Apuntador para el auto-scroll

  // Efecto 1: Bajar el scroll automáticamente cuando hay nuevos comentarios
  useEffect(() => {
    if (finalDelChatRef.current) {
      finalDelChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios]); // Se ejecuta cada vez que la lista de comentarios cambia

  // Efecto 2: "Polling" (preguntar al servidor cada 3 segundos si hay mensajes nuevos de otros)
  useEffect(() => {
    let intervalo;
    if (editandoId) {
      intervalo = setInterval(() => {
        cargarComentarios(editandoId);
      }, 3000); // 3000 milisegundos = 3 segundos
    }
    // Cuando cierras el modal, apagamos el motor para no gastar internet
    return () => clearInterval(intervalo); 
  }, [editandoId]);
  const [formulario, setFormulario] = useState({
    asunto: '', categoria: '', prioridad: 'Media', descripcion: ''
  });

  const URL_API = 'https://back-tickets-u01r.onrender.com/api';
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
    setComentarios([]); // Limpiamos comentarios al crear uno nuevo
    setMostrarModal(true);
  };

  // ==========================================
  // NUEVO (BITÁCORA): Cargar comentarios al abrir el ticket
  // ==========================================
  const cargarComentarios = async (idTicket) => {
    try {
      const respuesta = await fetch(`${URL_API}/tickets/${idTicket}/comentarios`);
      const datos = await respuesta.json();
      setComentarios(datos);
    } catch (error) {
      console.error("Error al cargar comentarios", error);
    }
  };

  const abrirModalEditar = (ticket) => {
    setFormulario({
      asunto: ticket.asunto,
      categoria: ticket.categoria,
      prioridad: ticket.prioridad,
      descripcion: ticket.descripcion
    });
    setEditandoId(ticket.id);
    cargarComentarios(ticket.id); // Pedimos al servidor el historial
    setNuevoComentario('');
    setMostrarModal(true);
  };

  // ==========================================
  // NUEVO (BITÁCORA): Función para enviar una nota
  // ==========================================
  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return; // No enviar si está vacío
    try {
      const respuesta = await fetch(`${URL_API}/tickets/${editandoId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: usuario, texto: nuevoComentario })
      });
      const comentarioCreado = await respuesta.json();
      setComentarios([...comentarios, comentarioCreado]); // Lo agregamos a la pantalla al instante
      setNuevoComentario(''); // Limpiamos la caja de texto
    } catch (error) {
      toast.error("Error al guardar la nota.");
    }
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

  const asignarmeTicket = async (idTabla) => {
    try {
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

  const datosEstado = [
    { name: 'Abiertos', value: ticketsAbiertos },
    { name: 'En Proceso', value: ticketsEnProceso },
    { name: 'Resueltos', value: ticketsResueltos },
  ];
  const COLORES_ESTADO = ['#dc3545', '#ffc107', '#198754']; 

  const conteoCategorias = tickets.reduce((acc, ticket) => {
    acc[ticket.categoria] = (acc[ticket.categoria] || 0) + 1;
    return acc;
  }, {});
  
  const datosCategoria = Object.keys(conteoCategorias).map(key => ({
    name: key,
    cantidad: conteoCategorias[key]
  }));

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
              localStorage.removeItem('rol_usuario');
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

        {rolUsuario === 'admin' && (
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm h-100 border-0 p-3">
                <h6 className="text-center fw-bold text-secondary mb-3">Distribución por Estado</h6>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={datosEstado} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {datosEstado.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES_ESTADO[index % COLORES_ESTADO.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm h-100 border-0 p-3">
                <h6 className="text-center fw-bold text-secondary mb-3">Incidencias por Categoría</h6>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosCategoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#0d6efd" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                      <td><span className="badge bg-light text-dark border">{ticket.tecnico_asignado || 'Sin asignar'}</span></td>
                      <td><span className={`badge ${obtenerColorEstado(ticket.estado)}`}>{ticket.estado}</span></td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          {(rolUsuario === 'tecnico' || rolUsuario === 'admin') && (
                            <select className="form-select form-select-sm" style={{ width: '110px' }} value={ticket.estado} onChange={(e) => cambiarEstadoTicket(ticket.id, e.target.value)}>
                              <option value="Abierto">Abierto</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Resuelto">Resuelto</option>
                            </select>
                          )}
                          {(rolUsuario === 'tecnico' || rolUsuario === 'admin') && (
                            <button className="btn btn-info btn-sm text-white" title="Asignarme a mí" onClick={() => asignarmeTicket(ticket.id)}>🙋‍♂️</button>
                          )}
                          {(rolUsuario === 'final' || rolUsuario === 'admin' || rolUsuario === 'tecnico') && (
                            <button className="btn btn-warning btn-sm text-white" title="Abrir y Editar" onClick={() => abrirModalEditar(ticket)}>✏️</button>
                          )}
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

      {/* EL MODAL DE CREACIÓN / EDICIÓN Y BITÁCORA */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg"> {/* modal-lg para hacerlo más ancho */}
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-secondary">
                  {editandoId ? "Detalles y Bitácora del Ticket" : "Reportar Incidencia o Tarea"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              
              <div className="modal-body">
                {/* Formulario principal del ticket. Nota el id="formTicket" */}
                <form id="formTicket" onSubmit={guardarTicket}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Asunto breve</label>
                    <input type="text" className="form-control" name="asunto" value={formulario.asunto} onChange={manejarCambio} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Categoría</label>
                      <select className="form-select" name="categoria" value={formulario.categoria} onChange={manejarCambio} required>
                        <option value="" disabled>Seleccione...</option>
                        <option value="CCTV y Seguridad">CCTV y Seguridad</option>
                        <option value="Sistemas de Alarmas">Sistemas de Alarmas</option>
                        <option value="Terminaciones">Terminaciones en Obra</option>
                        <option value="Hardware e Insumos">Hardware e Insumos</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Prioridad</label>
                      <select className="form-select" name="prioridad" value={formulario.prioridad} onChange={manejarCambio}>
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Descripción detallada</label>
                    <textarea className="form-control" rows="3" name="descripcion" value={formulario.descripcion} onChange={manejarCambio} required></textarea>
                  </div>
                </form>

                {/* ========================================== */}
                {/* NUEVO (BITÁCORA): Renderizado del Historial */}
                {/* ========================================== */}
                {editandoId && (
                  <div className="mt-4 pt-4 border-top">
                    <h6 className="fw-bold text-secondary mb-3">💬 Bitácora de procesos</h6>
                    
                  {/* Caja con scroll para los comentarios */}
                    <div className="bg-light p-3 rounded mb-3 border" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {comentarios.length > 0 ? (
                        comentarios.map((c) => (
                          <div key={c.id} className="mb-3 pb-2 border-bottom">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-primary small">{c.autor}</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(c.fecha).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-dark small">{c.texto}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted small text-center mb-0 fst-italic">No hay notas registradas en este ticket.</p>
                      )}
                      
                      {/* NUEVO: El ancla invisible al final del chat */}
                      <div ref={finalDelChatRef} />
                      
                    </div>

                    {/* Input para agregar un nuevo comentario */}
                    <div className="d-flex gap-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Escribir una actualización o repuesto necesario..." 
                        value={nuevoComentario} 
                        onChange={(e) => setNuevoComentario(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && enviarComentario()} 
                      />
                      <button type="button" className="btn btn-primary btn-sm px-4" onClick={enviarComentario}>
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cerrar</button>
                {/* Vinculamos este botón al id="formTicket" que está arriba */}
                <button type="submit" form="formTicket" className="btn btn-success">
                  {editandoId ? "Actualizar Datos del Ticket" : "Generar Ticket Nuevo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}