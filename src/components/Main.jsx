import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import logo from '../assets/logo.png';
import * as XLSX from 'xlsx';

export default function Main({ cambiarVista, usuario }) {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true); 
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null); 
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const finalDelChatRef = useRef(null);

  // GESTIÓN DE USUARIOS
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);

  // NUEVO: Agregamos tipo_origen al formulario inicial
  const [formulario, setFormulario] = useState({
    asunto: '', categoria: '', prioridad: 'Media', descripcion: '', tipo_origen: 'Interno'
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

  useEffect(() => {
    if (finalDelChatRef.current) {
      finalDelChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios]);

  useEffect(() => {
    let intervalo;
    if (editandoId) {
      intervalo = setInterval(() => {
        cargarComentarios(editandoId);
      }, 3000); 
    }
    return () => clearInterval(intervalo); 
  }, [editandoId]);

  const obtenerColorEstado = (estado) => {
    if (estado === 'Abierto') return 'bg-danger';
    if (estado === 'En Proceso') return 'bg-warning text-dark';
    if (estado === 'Resuelto') return 'bg-success';
    if (estado === 'Cerrado Definitivo') return 'bg-dark text-white';
    return 'bg-secondary';
  };
  // ==========================================
  // NUEVO: Calcular cuenta regresiva (SLA de 5 días)
  // ==========================================
  const calcularTiempoRestante = (fechaFinalizado) => {
    if (!fechaFinalizado) return "";
    
    const fechaFin = new Date(fechaFinalizado);
    fechaFin.setDate(fechaFin.getDate() + 5); // Le sumamos 5 días a la fecha de resolución
    
    const ahora = new Date();
    const diferenciaMs = fechaFin - ahora;

    if (diferenciaMs <= 0) return "Cierre inminente"; // Si el backend tarda en cerrarlo

    // Convertimos los milisegundos a días y horas
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenciaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return `${dias}d ${horas}h restantes`;
    return `${horas}h restantes`;
  };

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setFormulario({ asunto: '', categoria: '', prioridad: 'Media', descripcion: '', tipo_origen: 'Interno' });
    setEditandoId(null);
    setComentarios([]); 
    setMostrarModal(true);
  };

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
      descripcion: ticket.descripcion,
      tipo_origen: ticket.tipo_origen || 'Interno'
    });
    setEditandoId(ticket.id);
    cargarComentarios(ticket.id); 
    setNuevoComentario('');
    setMostrarModal(true);
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return; 
    try {
      const respuesta = await fetch(`${URL_API}/tickets/${editandoId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: usuario, texto: nuevoComentario })
      });
      const comentarioCreado = await respuesta.json();
      setComentarios([...comentarios, comentarioCreado]); 
      setNuevoComentario(''); 
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
      const respuesta = await fetch(`${URL_API}/tickets/${idTabla}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!respuesta.ok) throw new Error("Fallo en servidor");
      
      // NUEVO: Atrapamos el ticket completo que devuelve PostgreSQL con la fecha exacta
      const ticketActualizadoBD = await respuesta.json(); 

      const ticketsActualizados = tickets.map((ticket) => {
        if (ticket.id === idTabla) return ticketActualizadoBD; // Reemplazamos con los datos frescos
        return ticket;
      });
      setTickets(ticketsActualizados);
      toast.success(nuevoEstado === 'Resuelto' ? "¡Ticket Finalizado! Comienza cuenta regresiva de 5 días." : "Estado actualizado");
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

  const exportarAExcel = () => {
    const datosParaExcel = ticketsFiltrados.map(ticket => ({
      "Código": ticket.codigo,
      "Asunto": ticket.asunto,
      "Origen": ticket.tipo_origen || 'Interno',
      "Categoría": ticket.categoria,
      "Prioridad": ticket.prioridad,
      "Técnico Asignado": ticket.tecnico_asignado || 'Sin asignar',
      "Estado": ticket.estado,
      "Fecha de Creación": new Date(ticket.fecha_creacion).toLocaleDateString(),
      "Fecha Finalizado": ticket.fecha_finalizado ? new Date(ticket.fecha_finalizado).toLocaleDateString() : 'Pendiente',
      "Descripción Detallada": ticket.descripcion
    }));
    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte IT");
    XLSX.writeFile(libro, "Reporte_Soporte_IT.xlsx");
    toast.success("¡Reporte de Excel descargado con éxito!");
  };

  const abrirPanelUsuarios = async () => {
    try {
      const respuesta = await fetch(`${URL_API}/usuarios`);
      const datos = await respuesta.json();
      setUsuariosLista(datos);
      setMostrarModalUsuarios(true);
    } catch (error) {
      toast.error("Error al cargar los usuarios.");
    }
  };

  const cambiarRolUsuario = async (idUsuario, nuevoRol) => {
    try {
      await fetch(`${URL_API}/usuarios/${idUsuario}/rol`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol })
      });
      setUsuariosLista(usuariosLista.map(u => u.id === idUsuario ? { ...u, rol: nuevoRol } : u));
      toast.success("Rol de usuario actualizado.");
    } catch (error) {
      toast.error("Error al cambiar el rol.");
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
   <header className="navbar navbar-dark bg-dark shadow-sm position-relative">
        <div className="container">
          
          {/* IZQUIERDA: Solo el Logo */}
          <span className="navbar-brand mb-0">
            <img 
              src={logo} 
              alt="Logo Cruz de Malta" 
              className="img-fluid rounded" 
              style={{ height: '40px', width: 'auto' }}
            />
          </span>

          <div className="position-absolute start-50 translate-middle-x text-white d-none d-sm-block">
            <h5 className="mb-0 fw-bold tracking-wide">Sistema de Tickets</h5>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <span className="text-light d-none d-md-inline">
              Hola, <strong>{usuario}</strong> <span className="badge bg-secondary ms-1">{rolUsuario.toUpperCase()}</span>
            </span>
            
            {rolUsuario === 'admin' && (
              <button className="btn btn-warning btn-sm fw-bold shadow-sm" onClick={abrirPanelUsuarios}>
                👥 Usuarios
              </button>
            )}
            
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
          
          <div className="d-flex gap-2">
            {rolUsuario === 'admin' && (
              <button className="btn btn-success fw-bold shadow-sm" onClick={exportarAExcel}>
                📊 Descargar Excel
              </button>
            )}
            <button className="btn btn-primary shadow-sm" onClick={abrirModalCrear}>
              + Nuevo Ticket
            </button>
          </div>
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
                <h6 className="text-center fw-bold text-secondary mb-3">Incidencias por Categoría IT</h6>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={datosCategoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      
                      {/* NUEVO: Agregamos allowDecimals={false} para forzar números enteros */}
                      <XAxis type="number" allowDecimals={false} />
                      
                      <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#0d6efd" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NUEVO: Filtros con las categorías reales de IT */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className={`btn btn-sm ${filtroCategoria === 'Todas' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFiltroCategoria('Todas')}>Todas</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Redes e Internet' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFiltroCategoria('Redes e Internet')}>🌐 Redes e Internet</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Active Directory / Accesos' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setFiltroCategoria('Active Directory / Accesos')}>🔑 Active Directory / Accesos</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Hardware e Insumos' ? 'btn-info text-white' : 'btn-outline-info'}`} onClick={() => setFiltroCategoria('Hardware e Insumos')}>💻 Hardware e Insumos</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Software y SO' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFiltroCategoria('Software y SO')}>💽 Software y SO</button>
        <button className={`btn btn-sm ${filtroCategoria === 'CCTV' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setFiltroCategoria('CCTV')}>📹 CCTV</button>
        </div>

        <div className="mb-3">
          <input type="text" className="form-control" placeholder="🔍 Buscar por Código o Asunto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        
        <div className="card shadow-sm">
          <div className="card-body p-0 table-responsive">
            <table className="table table-hover mb-0 text-center align-middle" style={{ fontSize: '0.9rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Origen</th>
                  <th>Asunto</th>
                  <th>Categoría</th>
                  <th>Técnico</th> 
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
                      {/* 1. Código */}
                      <td className="fw-bold">{ticket.codigo}</td>
                      
                      {/* 2. Origen */}
                      <td>
                        <span className={`badge ${ticket.tipo_origen === 'Externo' ? 'bg-purple text-white border border-purple' : 'bg-info text-dark'} `} style={{ backgroundColor: ticket.tipo_origen === 'Externo' ? '#6f42c1' : '' }}>
                          {ticket.tipo_origen || 'Interno'}
                        </span>
                      </td>

                      {/* 3. Asunto */}
                      <td>{ticket.asunto}</td>
                      
                      {/* 4. Categoría */}
                      <td>{ticket.categoria}</td>
                      
                      {/* 5. Técnico */}
                      <td><span className="badge bg-light text-dark border">{ticket.tecnico_asignado || 'Sin asignar'}</span></td>
                      
                      {/* 6. Estado (CON EL RELOJ) */}
                      <td>
                        <div className="d-flex flex-column align-items-center">
                          <span className={`badge ${obtenerColorEstado(ticket.estado)}`}>{ticket.estado}</span>
                          {ticket.estado === 'Resuelto' && ticket.fecha_finalizado && (
                            <span className="text-muted mt-1" style={{ fontSize: '0.70rem', fontWeight: 'bold' }}>
                              ⏱️ {calcularTiempoRestante(ticket.fecha_finalizado)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Acciones */}
                      <td>
                        {ticket.estado === 'Cerrado Definitivo' ? (
                          <span className="badge bg-light text-dark border p-2">🔒 Archivado</span>
                        ) : (
                          <div className="d-flex justify-content-center align-items-center gap-1">
                            {(rolUsuario === 'tecnico' || rolUsuario === 'admin') && (
                              <select className="form-select form-select-sm border-secondary shadow-sm" style={{ width: '105px' }} value={ticket.estado} onChange={(e) => cambiarEstadoTicket(ticket.id, e.target.value)}>
                                <option value="Abierto">Abierto</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Resuelto" className="fw-bold text-success">Resuelto</option>
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
                        )}
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

      {/* MODAL DE CREACIÓN / EDICIÓN Y BITÁCORA */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg"> 
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-secondary">
                  {editandoId ? "Detalles y Bitácora del Ticket" : "Reportar Incidencia de Soporte IT"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              
              <div className="modal-body">
                <form id="formTicket" onSubmit={guardarTicket}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Asunto breve (Ej: PC sin internet)</label>
                    <input type="text" className="form-control" name="asunto" value={formulario.asunto} onChange={manejarCambio} required />
                  </div>
                  <div className="row">
                    
                    {/* NUEVO: Selector de Origen (Interno/Externo) */}
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Origen / Cliente</label>
                      <select className="form-select border-primary" name="tipo_origen" value={formulario.tipo_origen} onChange={manejarCambio} required>
                        <option value="Interno">🏢 Personal Interno</option>
                        <option value="Externo">🤝 Cliente Externo</option>
                      </select>
                    </div>

                    <div className="col-md-5 mb-3">
                      <label className="form-label fw-bold">Categoría IT</label>
                      <select className="form-select" name="categoria" value={formulario.categoria} onChange={manejarCambio} required>
                        <option value="" disabled>Seleccione...</option>
                        <option value="Redes e Internet">Redes e Internet</option>
                        <option value="Active Directory / Accesos">Active Directory / Accesos</option>
                        <option value="Hardware e Insumos">Hardware e Insumos</option>
                        <option value="Software y SO">Software y Sistema Operativo</option>
                        <option value="CCTV">CCTV</option>
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label fw-bold">Prioridad</label>
                      <select className="form-select" name="prioridad" value={formulario.prioridad} onChange={manejarCambio}>
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">🚨 Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Descripción detallada</label>
                    <textarea className="form-control" rows="3" name="descripcion" value={formulario.descripcion} onChange={manejarCambio} placeholder="Explique el problema con el mayor detalle posible..." required></textarea>
                  </div>
                </form>

                {/* BITÁCORA */}
                {editandoId && (
                  <div className="mt-4 pt-4 border-top">
                    <h6 className="fw-bold text-secondary mb-3">💬 Bitácora de Soporte</h6>
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
                      <div ref={finalDelChatRef} />
                    </div>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control form-control-sm" placeholder="Registrar una actualización del caso..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarComentario()} />
                      <button type="button" className="btn btn-primary btn-sm px-4" onClick={enviarComentario}>Enviar</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cerrar</button>
                <button type="submit" form="formTicket" className="btn btn-success">
                  {editandoId ? "Actualizar Ticket" : "Generar Nuevo Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GESTIÓN DE USUARIOS */}
      {mostrarModalUsuarios && rolUsuario === 'admin' && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">👥 Gestión de Permisos y Roles</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setMostrarModalUsuarios(false)}></button>
              </div>
              <div className="modal-body p-0">
                <table className="table table-hover mb-0 text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol Actual</th>
                      <th>Cambiar Rol a...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosLista.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-bold">{u.nombre}</td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <span className={`badge ${u.rol === 'admin' ? 'bg-danger' : u.rol === 'tecnico' ? 'bg-primary' : 'bg-secondary'}`}>
                            {u.rol.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <select className="form-select form-select-sm mx-auto" style={{ width: '130px' }} value={u.rol} onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}>
                            <option value="final">Usuario Final</option>
                            <option value="tecnico">Técnico</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModalUsuarios(false)}>Cerrar Panel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}