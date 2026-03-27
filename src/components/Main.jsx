import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import logo from '../assets/logo.png';
import { useCarga } from '../../hooks/useCarga'; 
import * as XLSX from 'xlsx';
import { io } from 'socket.io-client';
import sonidoAlerta from '../assets/alarma.mp3';
import { useTareas } from '../../hooks/useTareas'; // Ajusta la ruta si es necesario
import { useTickets } from '../../hooks/useTickets';

const socket = io('https://back-tickets-u01r.onrender.com');
// const socket = io('http://localhost:3000');

export default function Main({ cambiarVista, usuario }) {
   const { mostrarCarga, ocultarCarga, VistaCarga } = useCarga();
  const URL_API = 'https://back-tickets-u01r.onrender.com/api';
  // const URL_API = 'http://localhost:3000/api';
  const rolUsuario = localStorage.getItem('rol_usuario') || 'final';

  // ---> INSTANCIAMOS EL NUEVO HOOK DE TAREAS <---
  const {
    tareas, setTareas, mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea, manejarDias, guardarTarea, 
    marcarTareaCompletada, iniciarTarea, pausarTarea, eliminarTarea,
    exportarHistorialTareas, calcularTiempoTarea, fueCompletadaHoy, esTareaFutura, formatearFrecuenciaTexto, abrirModalEditarTarea
  } = useTareas(URL_API, usuario, mostrarCarga, ocultarCarga);

  // ---> INSTANCIAMOS EL NUEVO HOOK DE TICKETS <--- 
  const {
    tickets, setTickets, cargando, setCargando, mostrarModal, setMostrarModal,
    editandoId, setEditandoId, comentarios, setComentarios, nuevoComentario, setNuevoComentario,
    ticketsConMensaje, setTicketsConMensaje, formulario, setFormulario,
    editandoIdRef, finalDelChatRef, esSoloLectura, obtenerColorEstado, calcularTiempoRestante,
    manejarCambio, abrirModalCrear, abrirModalEditar, enviarComentario,
    guardarTicket, cambiarEstadoTicket, asignarmeTicket, eliminarTicket
  } = useTickets(URL_API, usuario, mostrarCarga, ocultarCarga);
 
  // ==========================================
  // ESTADOS PARA TICKETS
  // ==========================================

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [clientesLista, setClientesLista] = useState([]);
  const [ingresandoNuevoCliente, setIngresandoNuevoCliente] = useState(false);

  // GESTIÓN DE USUARIOS
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);
  // ==========================================
  // ESTADOS PARA RUTINAS DIARIAS (Mantenimiento)
  // ==========================================
  const [pestañaActual, setPestañaActual] = useState('tickets'); // Controla si vemos 'tickets' o 'tareas'

  // ====================================================
  // NUEVO: GUARDIÁN DE SESIÓN (Sobrevive al F5 y dura 15 min)
  // ====================================================
  const cerrarSesionAuto = () => {
    localStorage.removeItem('token_acceso'); 
    localStorage.removeItem('nombre_usuario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('area_usuario');
    localStorage.removeItem('horaLogin'); // Borramos el reloj
    
    // Le avisamos al usuario y lo mandamos al login
    toast.warning("⏱️ Tu sesión ha expirado por seguridad.");
    cambiarVista('login');
  };

// ====================================================
  // NUEVO: GUARDIÁN DE INACTIVIDAD (15 Minutos sin tocar nada)
  // ====================================================
  useEffect(() => {
    let ultimoRegistro = Date.now();

    // 1. Esta función resetea el reloj a "ahora"
    const registrarActividad = () => {
      const ahora = Date.now();
      // MAGIA DE RENDIMIENTO: Solo guardamos la actividad cada 2 segundos máximo.
      // Así no saturamos la memoria de la PC cuando el usuario mueve mucho el mouse.
      if (ahora - ultimoRegistro > 2000) {
        localStorage.setItem('ultimaActividad', ahora);
        ultimoRegistro = ahora;
      }
    };

    // Dejamos la marca de tiempo inicial al entrar
    localStorage.setItem('ultimaActividad', Date.now());

    // 2. Le ponemos "sensores" a toda la pantalla
    window.addEventListener('mousemove', registrarActividad);
    window.addEventListener('keydown', registrarActividad);
    window.addEventListener('click', registrarActividad);
    window.addEventListener('scroll', registrarActividad);

    // 3. El patrullero: Pasa cada 1 minuto a revisar si el usuario se durmió
    const patrullero = setInterval(() => {
      const ultimaVez = parseInt(localStorage.getItem('ultimaActividad') || Date.now());
      const tiempoActual = Date.now();
      
      const limiteInactividad = 15 * 60 * 1000; // 15 minutos en milisegundos

      // Si la diferencia entre "ahora" y la "última vez que movió el mouse" es mayor a 15 min:
      if (tiempoActual - ultimaVez > limiteInactividad) {
        cerrarSesionAuto();
      }
    }, 60000); // Revisa cada 60.000 ms (1 minuto)

    // 4. Limpieza (cuando el usuario cierra el componente)
    return () => {
      window.removeEventListener('mousemove', registrarActividad);
      window.removeEventListener('keydown', registrarActividad);
      window.removeEventListener('click', registrarActividad);
      window.removeEventListener('scroll', registrarActividad);
      clearInterval(patrullero);
    };
  }, []);
  // ====================================================

  useEffect(() => {
    editandoIdRef.current = editandoId;
  }, [editandoId]);
  useEffect(() => {
    editandoIdRef.current = editandoId;
  }, [editandoId]);

 let areaUsuario = localStorage.getItem('area_usuario');
  // Si no existe, o si es literalmente la palabra "undefined" o "null"
  if (!areaUsuario || areaUsuario === 'undefined' || areaUsuario === 'null') {
    areaUsuario = 'Área no asignada';
  } // <-- NUEVO
// NUEVO: Identificamos si el ticket abierto está bloqueado
  const ticketAbierto = tickets.find(t => t.id === editandoId);


  useEffect(() => {
    // 1. Carga inicial tradicional (una sola vez)
    const obtenerDatos = async () => {
      try {
        const respuestaTickets = await fetch(`${URL_API}/tickets`);
        setTickets(await respuestaTickets.json());
const respuestaClientes = await fetch(`${URL_API}/clientes`);
        setClientesLista(await respuestaClientes.json());
        const respuestaTareas = await fetch(`${URL_API}/tareas`);
        setTareas(await respuestaTareas.json());
      } catch (error) {
        toast.error("Error al cargar los datos del servidor.");
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();

  
    // ==================================================
    // 2. MAGIA WEBSOCKETS: TICKETS --> Escuchamos eventos en tiempo real
    // ==================================================
    
    // Si alguien crea un ticket, lo agregamos arriba de la lista y hacemos sonar la alerta
    socket.on('ticketCreado', (nuevoTicket) => {
      
      // 1. LÓGICA DE ALERTA SONORA (Solo suena para IT, y si lo creó otra persona)
      if (nuevoTicket.solicitante !== usuario && (rolUsuario === 'admin' || rolUsuario === 'tecnico')) {
        const audio = new Audio(sonidoAlerta);
        // Usamos catch porque algunos navegadores bloquean el sonido si el usuario no ha hecho clic en la pantalla antes
        audio.play().catch(error => console.log("El navegador bloqueó el sonido automático", error));
      }

      // 2. ACTUALIZAMOS LA PANTALLA
      setTickets((ticketsAnteriores) => {
        const yaExiste = ticketsAnteriores.some(ticket => ticket.id === nuevoTicket.id);
        if (yaExiste) return ticketsAnteriores; 
        
        return [nuevoTicket, ...ticketsAnteriores]; 
      });
    });
    // Si alguien edita o cambia de estado, actualizamos ese renglón específico
    socket.on('ticketModificado', (ticketEditado) => {
      setTickets((ticketsAnteriores) => 
        ticketsAnteriores.map(t => t.id === ticketEditado.id ? ticketEditado : t)
      );
    });
    
    // Antena para mensajes de la Bitácora
    socket.on('nuevoComentario', (comentarioNuevo) => {
      
      // 1. Suena la alerta SOLO si el mensaje lo escribió otra persona
      if (comentarioNuevo.autor !== usuario) {
        const audio = new Audio(sonidoAlerta);
        audio.play().catch(e => console.log("Audio bloqueado", e));
      }

      // 2. ¿Tengo este ticket abierto en mi pantalla ahora mismo?
      if (editandoIdRef.current === comentarioNuevo.ticket_id) {
        // Sí, lo tengo abierto. Actualizo el chat al instante sin recargar.
        setComentarios(prev => [...prev, comentarioNuevo]);
      } else {
        // No lo tengo abierto. ¡Encendemos el puntito rojo en la tabla!
        setTicketsConMensaje(prev => {
          if (!prev.includes(comentarioNuevo.ticket_id)) {
            return [...prev, comentarioNuevo.ticket_id];
          }
          return prev;
        });
      }
    });
    // ==================================================
    // MAGIA WEBSOCKETS: RUTINAS
    // ==================================================
    
    // Antena 1: Si alguien crea una nueva rutina
    socket.on('tareaCreada', (nuevaTarea) => {
      setTareas((tareasAnteriores) => {
        // Filtro anti-eco: ¿La tarea nueva ya la tengo dibujada?
        const yaExiste = tareasAnteriores.some(t => t.id === nuevaTarea.id);
        if (yaExiste) return tareasAnteriores;
        
        // Si no la tengo, la agrego y ordeno la lista por hora
        return [...tareasAnteriores, nuevaTarea].sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
    });

    // Antena 2: Si alguien completa una rutina
    socket.on('tareaCompletada', (tareaActualizada) => {
      setTareas((tareasAnteriores) => {
        // Busco la tarea vieja en mi lista y la reemplazo por la nueva (que ya viene tachada del backend)
        const nuevasTareas = tareasAnteriores.map(t => t.id === tareaActualizada.id ? tareaActualizada : t);
        
        // Vuelvo a ordenar por si acaso
        return nuevasTareas.sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
    });
    // ---> NUEVO: Antena 3: Si alguien inicia o pausa una tarea
    socket.on('tareaModificada', (tareaActualizada) => {
      setTareas((tareasAnteriores) => {
        const nuevasTareas = tareasAnteriores.map(t => t.id === tareaActualizada.id ? tareaActualizada : t);
        return nuevasTareas.sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
    });
    // ---> NUEVO: Antena 4: Si alguien elimina una tarea
    socket.on('tareaEliminada', (idTareaEliminada) => {
      setTareas((tareasAnteriores) => tareasAnteriores.filter(t => t.id !== idTareaEliminada));
    });
    // NUEVO: Escuchar cuando alguien crea un cliente externo nuevo
    socket.on('clienteCreado', (nuevoCliente) => {
      setClientesLista((prevLista) => {
        // Verificamos que no esté duplicado por las dudas
        const existe = prevLista.find(c => c.id === nuevoCliente.id);
        if (existe) return prevLista;
        
        // Lo agregamos a la lista y la re-ordenamos alfabéticamente
        const listaActualizada = [...prevLista, nuevoCliente];
        return listaActualizada.sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
    });

    // Y recuerda apagarla en el return de limpieza que está justo abajo:
    return () => {
      socket.off('ticketCreado');
      socket.off('ticketModificado');
      socket.off('tareaCreada');       
      socket.off('tareaCompletada');   
      socket.off('tareaModificada');
      socket.off('tareaEliminada');
      socket.off('nuevoComentario');
      socket.off('clienteCreado');
    };  
    }, []); // <-- El array vacío asegura que la conexión se crea una sola vez

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


  const cargarComentarios = async (idTicket) => {
    try {
      const respuesta = await fetch(`${URL_API}/tickets/${idTicket}/comentarios`);
      const datos = await respuesta.json();
      setComentarios(datos);
    } catch (error) {
      console.error("Error al cargar comentarios", error);
    }
  };


  const exportarAExcel = () => {
    const datosParaExcel = ticketsFiltrados.map(ticket => ({
      "Código": ticket.codigo,
      "Asunto": ticket.asunto,
      "Origen": ticket.tipo_origen || 'Interno',
      "Cliente / Solicitante": ticket.tipo_origen === 'Externo' ? (ticket.cliente || 'Sin cliente') : (ticket.solicitante || 'Usuario'),
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
  // ==========================================
  // NUEVO: Exportar Historial de Tareas a Excel
  // ==========================================
  
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
    // 1. REGLA DE PRIVACIDAD: ¿Quién está mirando?
    let permisoVer = false;
    if (rolUsuario === 'admin' || rolUsuario === 'tecnico') {
      permisoVer = true; // Los de IT ven todo el panorama
    } else {
      // El usuario final solo ve los tickets donde él sea el solicitante
      permisoVer = ticket.solicitante === usuario; 
    }
    const coincideBusqueda = 
    ticket.asunto?.toLowerCase().includes(busqueda.toLowerCase()) || 
    ticket.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    ticket.solicitante?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (ticket.cliente && ticket.cliente.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideCategoria = filtroCategoria === 'Todas' || ticket.categoria === filtroCategoria;
    return permisoVer && coincideCategoria;
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
  
  // Función limpia para manejar el botón de nuevo ticket
  const manejarNuevoTicket = () => {
    abrirModalCrear(); // Llamamos a tu función del Hook que limpia el formulario
    setIngresandoNuevoCliente(false); // Apagamos el cuadrito de texto
  };
  
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
              style={{ height: '70px', width: 'auto' }}
            />
          </span>

          <div className="position-absolute start-50 translate-middle-x text-white d-none d-sm-block">
            <h5 className="mb-0 fw-bold tracking-wide">Sistema de Tickets</h5>
          </div>
          
          <div className="d-flex align-items-center gap-3">
           <span className="text-light d-none d-md-inline">
              🙋🏼 Hola, <strong>{usuario}</strong> <span className="text-info ms-1">({areaUsuario})</span>
              <span className="badge bg-secondary ms-2">{rolUsuario.toUpperCase()}</span>
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
              localStorage.removeItem('horaLogin');
              cambiarVista('login');
            }}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container mt-5 mb-5">
        {/* LAS PESTAÑAS DE NAVEGACIÓN */}
        <ul className="nav nav-tabs mb-4 border-bottom-0 gap-1">
          <li className="nav-item">
            <button className={`nav-link text-dark ${pestañaActual === 'tickets' ? 'active fw-bold border-bottom-0 shadow-sm' : 'bg-light border'}`} onClick={() => setPestañaActual('tickets')}>
              🎫 Soporte IT
            </button>
          </li>
          {(rolUsuario === 'admin' || rolUsuario === 'tecnico') &&  (
            <li className="nav-item">
            <button className={`nav-link text-dark ${pestañaActual === 'tareas' ? 'active fw-bold border-bottom-0 shadow-sm' : 'bg-light border'}`} onClick={() => setPestañaActual('tareas')}>
              🔄 Mantenimiento y Rutinas
            </button>
          </li>
          )}
          
        </ul>
        {/* ==================================================== */}
        {/* VISTA 1: TICKETS                       */}
        {/* ==================================================== */}
        {pestañaActual === 'tickets' && (
          <div className="animate__animated animate__fadeIn">
             {/* AQUÍ VA TODO TU CÓDIGO ACTUAL: El título "Mis Incidencias", los botones, los gráficos, los filtros y la tabla de tickets */}
            <div className="d-flex justify-content-between align-items-center mb-4">
          
          {rolUsuario === 'tecnico'&&(
            <h2 className="h3 text-secondary">Tickets</h2>
          )|| rolUsuario === 'final'&&(
            <h2 className="h3 text-secondary">Mis Incidencias</h2>
          )}
          <div className="d-flex gap-2">
            {rolUsuario === 'admin' && (
              <button className="btn btn-success fw-bold shadow-sm" onClick={exportarAExcel}>
                📊 Descargar Excel
              </button>
            )}
            <button 
              className="btn btn-primary" 
              onClick={manejarNuevoTicket}
            >
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
                      <Bar dataKey="cantidad" fill="#343a40" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NUEVO: Filtros con las categorías reales de IT */}
        {(rolUsuario  === 'Administrador' || rolUsuario === 'Tecnico') && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className={`btn btn-sm ${filtroCategoria === 'Todas' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFiltroCategoria('Todas')}>Todas</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Redes e Internet' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFiltroCategoria('Redes e Internet')}>🌐 Redes e Internet</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Active Directory / Accesos' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setFiltroCategoria('Active Directory / Accesos')}>🔑 Active Directory / Accesos</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Hardware e Insumos' ? 'btn-info text-white' : 'btn-outline-info'}`} onClick={() => setFiltroCategoria('Hardware e Insumos')}>💻 Hardware e Insumos</button>
          <button className={`btn btn-sm ${filtroCategoria === 'Software y SO' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFiltroCategoria('Software y SO')}>💽 Software y SO</button>
        <button className={`btn btn-sm ${filtroCategoria === 'CCTV' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setFiltroCategoria('CCTV')}>📹 CCTV</button>
        </div>
        )}

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
                  {(rolUsuario === 'admin' || rolUsuario === 'tecnico') && (
                  <th>Solicitante / Cliente</th>
                  )}
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
                        {(rolUsuario === 'admin' || rolUsuario === 'tecnico') && (
                        <td>
                          {ticket.tipo_origen === 'Externo' ? (
                            <span className="fw-bold" style={{ color: '#6f42c1' }}>🏢 {ticket.cliente || 'Sin cliente'}</span>
                          ) : (
                            <span>👤 {ticket.solicitante || 'Usuario'}</span>
                          )}
                        </td>
                      )}
                      {/* 4. Asunto */}
                      <td>{ticket.asunto}</td>
                      
                      {/* 5. Categoría */}
                      <td>{ticket.categoria}</td>
                      
                      {/* 6. Técnico */}
                      <td><span className="badge bg-light text-dark border">{ticket.tecnico_asignado || 'Sin asignar'}</span></td>
                      
                      {/* 7. Estado (CON EL RELOJ) */}
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

                      {/* 8. Acciones */}
                      <td>
                        {ticket.estado === 'Cerrado Definitivo' ? (
                         <div className="d-flex justify-content-center align-items-center gap-2">
                            <span className="badge bg-light text-dark border p-2">🔒 Archivado</span>
                            {/* NUEVO: Botón para ver el ticket bloqueado */}
                            <button className="btn btn-secondary btn-sm text-white shadow-sm" title="Ver Historial" onClick={() => abrirModalEditar(ticket)}>
                              👁️ Ver
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-center align-items-center gap-1">
                            {/* ... (Aquí siguen tus otros botones que ya tenías: el select, asignarme, editar, eliminar) ... */}
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
                              <button 
                                className="btn btn-warning btn-sm text-white position-relative" 
                                title="Abrir y Editar" 
                                onClick={() => abrirModalEditar(ticket)}
                              >
                                ✏️
                                {ticketsConMensaje.includes(ticket.id) && (
                                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle shadow-sm" style={{ width: '12px', height: '12px' }}>
                                    <span className="visually-hidden">Mensajes nuevos</span>
                                  </span>
                                )}
                              </button>
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
          </div>
        )}
        {/* ==================================================== */}
        {/* VISTA 2: NUEVA PANTALLA DE TAREAS RECURRENTES          */}
        {/* ==================================================== */}
        {(rolUsuario === 'admin' || rolUsuario === 'tecnico') && pestañaActual === 'tareas' && (
          <div className="animate__animated animate__fadeIn">
            <h2 className="h3 text-secondary">Control de Tareas Diarias</h2>
              
              <div className="d-flex gap-2">
                {rolUsuario === 'admin' && (
                  <button className="btn btn-success fw-bold shadow-sm" onClick={exportarHistorialTareas}>
                    📊 Descargar Historial
                  </button>
                )}
                <button className="btn btn-primary shadow-sm" onClick={() => { 
                  setFormularioTarea({id: null, titulo: '', categoria: 'Limpieza / General', frecuencia: 'Diaria', hora_programada: '09:00', dias_especificos: [], fecha_unica: ''}); 
                  setMostrarModalTarea(true); 
                }}>
                  + Nueva Rutina
                </button>
              </div>
            
            <div className="card shadow-sm border-0">
              <div className="card-body p-0 table-responsive">
                <table className="table table-hover mb-0 text-center align-middle" style={{ fontSize: '0.9rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Rutina a realizar</th>
                      <th>Categoría</th>
                      <th>Frecuencia</th>
                      <th>Próxima Ejecución</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                   {tareas.length > 0 ? (
                      tareas.map(tarea => {
                        // Verificamos si la tarea ya se completó hoy
                       const completadaHoy = fueCompletadaHoy(tarea.ultima_vez_completada);
                       const tareaFutura = esTareaFutura(tarea.proxima_ejecucion);
                        // console.log(completadaHoy);
                        return (
                          <tr 
                            key={tarea.id} 
                            // Si está completada, le bajamos la opacidad al 50% para el efecto difuminado
                            style={{ opacity: completadaHoy ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
                          >
                            {/* Tachamos el título si ya está lista */}
                            <td className={`fw-bold text-start ps-4 ${completadaHoy ? 'text-decoration-line-through text-muted' : ''}`}>
                              {tarea.titulo}
                            </td>
                            <td><span className="badge bg-secondary">{tarea.categoria}</span></td>
                            <td className="text-secondary fw-semibold">
                              {formatearFrecuenciaTexto(tarea)} <span className="text-dark fw-normal">(⏰ {tarea.hora_programada?.substring(0, 5)})</span>
                            </td>
                           
                            <td>
                              <div className="d-flex flex-column align-items-center">
                                <span className={`fw-bold px-2 py-1 rounded ${new Date(tarea.proxima_ejecucion) < new Date() ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                                  {calcularTiempoTarea(tarea)}
                                </span>
                              </div>
                            </td>
                            {/* 5. Acciones y Botones del Cronómetro */}
                            <td className="d-flex justify-content-center align-items-center gap-2">
                              
                              {completadaHoy ? (
                                <div className="d-flex justify-content-center align-items-center gap-2">
                                  <span className="badge bg-light text-success border border-success px-3 py-2 shadow-sm">
                                    ✔️ Lista por hoy
                                  </span>
                                  {/* Botón Eliminar cuando ya está completada */}
                                  <button className="btn btn-outline-danger btn-sm shadow-sm" title="Eliminar Rutina" onClick={() => eliminarTarea(tarea.id)}>
                                    🗑️
                                  </button>
                                </div>
                              ) : tareaFutura ? (
                                /* NUEVO: SI ES DEL FUTURO, MOSTRAMOS UN RELOJ DE ARENA EN LUGAR DE LOS BOTONES */
                                <div className="d-flex justify-content-center align-items-center gap-2">
                                  <span className="badge bg-light text-secondary border px-3 py-2 shadow-sm">
                                    ⏳ Esperando fecha
                                  </span>
                                  <button className="btn btn-outline-danger btn-sm shadow-sm" title="Eliminar Rutina" onClick={() => eliminarTarea(tarea.id)}>🗑️</button>
                                </div>
                              ):(
                                <div className="d-flex justify-content-center flex-column align-items-center gap-2">
                                  <div className="d-flex gap-2 align-items-center">
                                    {/* Si está Pausada o Pendiente: Botón de INICIAR */}
                                    {(!tarea.estado || tarea.estado === 'Pendiente' || tarea.estado === 'Pausada' || tarea.en_pausa) && (
                                      <button 
                                        className="btn btn-primary btn-sm fw-bold shadow-sm px-3" 
                                        onClick={() => iniciarTarea(tarea.id)}
                                        title="Iniciar o Reanudar tarea"
                                      >
                                        ▶ Iniciar
                                      </button>
                                    )}

                                    {/* Si está En Curso: Botón de PAUSAR */}
                                    {(tarea.estado === 'En Curso' && !tarea.en_pausa) && (
                                      <button 
                                        className="btn btn-warning btn-sm text-dark fw-bold shadow-sm px-3" 
                                        onClick={() => pausarTarea(tarea.id)}
                                        title="Pausar por una emergencia"
                                      >
                                        ⏸ Pausar
                                      </button>
                                    )}

                                    {/* Botón FINALIZAR */}
                                    <button 
                                      className={`btn ${tarea.estado === 'En Curso' ? 'btn-success' : 'btn-outline-success'} btn-sm fw-bold shadow-sm px-3`} 
                                      onClick={() => marcarTareaCompletada(tarea.id)}
                                      title="Finalizar tarea"
                                    >
                                      ✅ Finalizar
                                    </button>
                                    
                                    {/* NUEVO: BOTÓN DE ELIMINAR */}
                                    <button 
                                      className="btn btn-outline-danger btn-sm shadow-sm ms-1" 
                                      title="Eliminar Rutina" 
                                      onClick={() => eliminarTarea(tarea.id)}
                                    >
                                      🗑️
                                    </button>
                                    
                                  </div>
                                  
                                  {/* Mostramos los minutos acumulados abajo de los botones */}
                                  {tarea.tiempo_acumulado_minutos > 0 && !completadaHoy && (
                                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                      ⏱️ {Math.floor(tarea.tiempo_acumulado_minutos)} min dedicados
                                    </div>
                                  )}
                                
                                </div>
                              )}
                              <button 
                                className="btn btn-outline-warning btn-sm shadow-sm ms-1" 
                                title="Editar Rutina" 
                                onClick={() => abrirModalEditarTarea(tarea)}
                              >
                                ✏️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="5" className="text-muted py-4">No hay rutinas programadas. ¡Crea la primera!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      {VistaCarga}
      </main>
{/**
 * 
 *  MODALES
 * 
 */}
      {/* MODAL DE CREACIÓN / EDICIÓN Y BITÁCORA */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg"> 
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-secondary">
                  {editandoId ? "Detalles y Bitácora del Ticket" : "Reportar Incidencia de Soporte IT"}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setMostrarModal(false); setEditandoId(null); }}></button>
              </div>
              
              <div className="modal-body">
                <form id="formTicket" onSubmit={guardarTicket}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Asunto breve (Ej: PC sin internet)</label>
                    <input type="text" className="form-control" name="asunto" value={formulario.asunto} onChange={manejarCambio} required disabled={esSoloLectura}/>
                  </div>
                  <div className="row">
                    
                    {/* NUEVO: Selector de Origen (Interno/Externo) */}
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Origen / Cliente</label>
                      <select className="form-select border-primary" name="tipo_origen" value={formulario.tipo_origen} onChange={manejarCambio} required disabled={esSoloLectura}>
                        <option value="Interno">🏢 Personal Interno</option>
                        <option value="Externo">🤝 Cliente Externo</option>
                      </select>
                    </div>

                    <div className="col-md-5 mb-3">
                      <label className="form-label fw-bold">Categoría IT</label>
                      <select className="form-select" name="categoria" value={formulario.categoria} onChange={manejarCambio} required disabled={esSoloLectura}>
                        <option value="" disabled>Seleccione...</option>
                        <option value="Redes e Internet">🌐 Redes e Internet</option>
                        <option value="Active Directory / Accesos">🔑 Active Directory / Accesos</option>
                        <option value="Hardware e Insumos">💻 Hardware e Insumos</option>
                        <option value="Software y SO">💽 Software y Sistema Operativo</option>
                        <option value="CCTV">📹 CCTV</option>
                        <option value="Reportes">📑 Reportes</option>
                        <option value="Mantenimiento">🛠️ Mantenimiento</option>
                        <option value="Programas/Aplicaciones">📱 Programas/Aplicaciones</option>
                      </select>
                    </div>

                    <div className="col-md-3 mb-3">
                      <label className="form-label fw-bold">Prioridad</label>
                      <select className="form-select" name="prioridad" value={formulario.prioridad} onChange={manejarCambio} disabled={esSoloLectura}>
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">🚨 Urgente</option>
                      </select>
                    </div>
                  </div>
                  {/* MAGIA UX: Solo aparece si eligen Externo */}
                    {formulario.tipo_origen === 'Externo' && (
                      <div className="col-md-12 mb-3 animate__animated animate__fadeIn">
                        <label className="form-label fw-bold text-purple">🏢 Seleccione el Cliente / Servicio</label>
                        
                        {!ingresandoNuevoCliente ? (
                          <select 
                            className="form-select border-purple" 
                            name="cliente"
                            value={formulario.cliente || ''} 
                            onChange={(e) => {
                              if(e.target.value === 'NUEVO_CLIENTE') {
                                setIngresandoNuevoCliente(true); // Cambiamos a modo "Texto"
                                manejarCambio({ target: { name: 'cliente', value: '' } }); // Limpiamos la variable
                              } else {
                                manejarCambio(e);
                              }
                            }}
                            required
                            disabled={esSoloLectura}
                          >
                            <option value="" disabled>Seleccione de la lista...</option>
                            {clientesLista.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                            <option value="NUEVO_CLIENTE" className="fw-bold text-success">➕ Agregar nuevo cliente que no está en la lista...</option>
                          </select>
                        ) : (
                          <div className="input-group">
                            <input 
                              type="text" 
                              className="form-control border-success shadow-sm" 
                              placeholder="Escriba el nombre exacto del nuevo cliente..."
                              name="cliente"
                              value={formulario.cliente || ''}
                              onChange={(e) => setFormulario({...formulario, cliente: e.target.value.toUpperCase()})}
                              required
                              disabled={esSoloLectura}
                              autoFocus
                            />
                            <button 
                              className="btn btn-outline-danger" 
                              type="button" 
                              onClick={() => {
                                setIngresandoNuevoCliente(false); // Volvemos al modo "Lista"
                                manejarCambio({ target: { name: 'cliente', value: '' } });
                              }}
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Descripción detallada</label>
                    <textarea className="form-control" rows="3" name="descripcion" value={formulario.descripcion} onChange={manejarCambio} placeholder="Explique el problema con el mayor detalle posible..." required disabled={esSoloLectura}></textarea>
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
                      <input type="text" className="form-control form-control-sm" placeholder="Registrar una actualización del caso..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarComentario()} disabled={esSoloLectura}/>
                      <button type="button" className="btn btn-primary btn-sm px-4" onClick={enviarComentario} disabled={esSoloLectura}>Enviar</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light" >
                  <button type="button" className="btn btn-secondary" onClick={() => { setMostrarModal(false); setEditandoId(null); }}>Cerrar</button>              
                  {/* 2. MAGIA UX: Solo mostramos el botón verde si estamos CREANDO un ticket nuevo, o si somos de IT */}
                  {(!editandoId || rolUsuario !== 'final') && (
                  <button type="submit" form="formTicket" className="btn btn-success" disabled={esSoloLectura}>
                    {editandoId ? "Guardar Cambios" : "Generar Nuevo Ticket"}
                  </button>
                )}
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
      {/* ========================================== */}
      {/* MODAL PARA CREAR RUTINA DIARIA             */}
      {/* ========================================== */}
      {mostrarModalTarea && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-secondary">Programar Mantenimiento</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModalTarea(false)}></button>
              </div>
              <div className="modal-body">
                <form id="formTarea" onSubmit={guardarTarea}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">¿Qué se debe realizar?</label>
                    <input type="text" className="form-control" value={formularioTarea.titulo} onChange={(e) => setFormularioTarea({...formularioTarea, titulo: e.target.value})} placeholder="Ej: Limpiar depósito principal, Revisión de DVR..." required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Categoría</label>
                    <select className="form-select" value={formularioTarea.categoria} onChange={(e) => setFormularioTarea({...formularioTarea, categoria: e.target.value})}>
                      <option value="Limpieza / General">🧹 Limpieza e Instalaciones</option>
                      <option value="CCTV y Servidores">📹 CCTV y Servidores</option>
                      <option value="Redes">🌐 Mantenimiento de Red</option>
                      <option value="Reportes"> 📑 Reportes</option>
                    </select>
                  </div>
                 <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label fw-bold">Frecuencia</label>
                      <select className="form-select" value={formularioTarea.frecuencia} onChange={(e) => setFormularioTarea({...formularioTarea, frecuencia: e.target.value})}>
                        <option value="Dias Especificos" className="fw-bold text-primary">📅 Días Específicos</option>
                        <option value="Fecha Unica" className="fw-bold text-success">🎯 Tarea Mensual</option>
                      </select>
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label fw-bold">Hora Límite de Ejecución</label>
                      <input type="time" className="form-control" value={formularioTarea.hora_programada} onChange={(e) => setFormularioTarea({...formularioTarea, hora_programada: e.target.value})} required />
                    </div>
                  </div>

                  {/* MAGIA CONDICIONAL: Solo aparece si eligen "Días Específicos" */}
                  {formularioTarea.frecuencia === 'Dias Especificos' && (
                    <div className="mb-3 p-3 bg-light border rounded shadow-sm">
                      <label className="form-label fw-bold d-block mb-2 text-primary">Seleccione los días a realizar:</label>
                      <div className="d-flex flex-wrap gap-2 justify-content-between">
                        {/* Nota: En JavaScript el Domingo es el día 0, Lunes 1, etc. */}
                        {[{id: 1, label: 'Lun'}, {id: 2, label: 'Mar'}, {id: 3, label: 'Mié'}, {id: 4, label: 'Jue'}, {id: 5, label: 'Vie'}, {id: 6, label: 'Sáb'}, {id: 0, label: 'Dom'}].map(dia => (
                          <div className="form-check form-check-inline me-0" key={dia.id}>
                            <input 
                              className="form-check-input border-primary cursor-pointer" 
                              type="checkbox" 
                              id={`dia-${dia.id}`} 
                              checked={formularioTarea.dias_especificos?.includes(dia.id)}
                              onChange={() => manejarDias(dia.id)} 
                            />
                            <label className="form-check-label fw-bold text-secondary cursor-pointer" htmlFor={`dia-${dia.id}`}>
                              {dia.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MAGIA CONDICIONAL: Solo aparece si eligen "Fecha Única" */}
                  {formularioTarea.frecuencia === 'Fecha Unica' && (
                    <div className="mb-3 p-3 bg-light border rounded shadow-sm border-success">
                      <label className="form-label fw-bold text-success">Seleccione la Fecha Exacta:</label>
                      <input 
                        type="date" 
                        className="form-control border-success" 
                        value={formularioTarea.fecha_unica} 
                        onChange={(e) => setFormularioTarea({...formularioTarea, fecha_unica: e.target.value})} 
                        required={formularioTarea.frecuencia === 'Fecha Unica'} 
                      />
                    </div>
                  )}
                </form>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModalTarea(false)}>Cancelar</button>
                <button type="submit" form="formTarea" className="btn btn-success">
  {formularioTarea.id ? "Guardar Cambios" : "Guardar Rutina"}
</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
    
  )
}