// React y Bibliotecas de UI
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';

// Hooks Personalizados
import { useCarga } from '../../hooks/useCarga'; 
import { useTareas } from '../../hooks/useTareas';
import { useTickets } from '../../hooks/useTickets';

// Recursos (Assets)
import logo from '../assets/logo.png';
import sonidoAlerta from '../assets/alarma.mp3';

// Componentes de Modales Externos
import ModalTicket from './ModalTicket';
import ModalUsuarios from './ModalUsuarios';
import ModalTarea from './ModalTarea';
import ModalFinalizarTarea from './ModalFinalizarTarea';
import { ModalHistorico } from './ModalHistorico'; 
import ModalHistoricoTareas from './ModalHistoricoTareas';
import ModalHistorialTarea from './ModalHistorialTarea'; 
import DropdownReporte from './DropdownReporte';
import TableroTareas from './TableroTarea';

//Dashboard Agustin
import { DashboardAgustin } from './ComponenteAgustin';
import { ROLES } from '../utils/constants.js';

const socket = io(import.meta.env.VITE_URL_BACKEND || '/');
// Función utilitaria para evitar errores de tipo al procesar fechas
const parsearFechaSegura = (fecha) => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (typeof fecha === 'string') {
    return new Date(fecha.replace(' ', 'T'));
  }
  return new Date(fecha);
};

export default function Main({ cambiarVista, usuario }) {
 
  const { mostrarCarga, ocultarCarga, VistaCarga } = useCarga();
  const URL_API = import.meta.env.VITE_URL_API || '/api';
  const rolUsuario = parseInt(localStorage.getItem('rol_usuario')) || ROLES.USUARIO_FINAL;

  // Optimización: Validaciones de Roles Cacheadas
  const miRol = parseInt(rolUsuario);
  const esAdmin = miRol === ROLES.ADMIN;
  const esTecnico = miRol === ROLES.TECNICO;
  const esCoordinadorGral = miRol === ROLES.COORDINADOR_GRAL;
  const esCoordinadorArea = miRol === ROLES.COORDINADOR_AREA;

 // ==========================================
  // 1. HOOKS PRINCIPALES
  // ==========================================
  // Hook de Tareas
  const [filtroCategoriaTarea, setFiltroCategoriaTarea] = useState('Todas');
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [tareaSeleccionadaFinalizar, setTareaSeleccionadaFinalizar] = useState(null);
  const [mostrarModalReporteTareas, setMostrarModalReporteTareas] = useState(false);

  const {
    tareas, setTareas, mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea, manejarDias, guardarTarea, 
    marcarTareaCompletada, iniciarTarea, pausarTarea, eliminarTarea,
    exportarHistorialTareas, calcularTiempoTarea, fueCompletadaHoy, esTareaFutura, formatearFrecuenciaTexto, abrirModalEditarTarea,
    indicadores, cargarIndicadores, marcarComoVista, asignarTarea
  } = useTareas(URL_API, usuario, mostrarCarga, ocultarCarga);

  // Hook de Tickets
  const {
    tickets, setTickets, cargando, setCargando, mostrarModal, setMostrarModal,
    editandoId, setEditandoId, comentarios, setComentarios, nuevoComentario, setNuevoComentario,
    ticketsConMensaje, setTicketsConMensaje, formulario, setFormulario,
    editandoIdRef, finalDelChatRef, esSoloLectura, obtenerColorEstado, calcularTiempoRestante,
    manejarCambio, abrirModalCrear, abrirModalEditar, enviarComentario,
    guardarTicket, cambiarEstadoTicket, asignarmeTicket, eliminarTicket, archivosTicketNuevo, setArchivosTicketNuevo
  } = useTickets(URL_API, usuario, mostrarCarga, ocultarCarga);
 
  // ==========================================
  // 2. REFS Y ESTADOS DE INTERFAZ
  // ==========================================

  const tablaTicketsRef = useRef(null);
  
  const coloresEstado = {
    'En proceso': 'bg-warning text-dark border-warning',
    'En pausa': 'bg-secondary',
    'Atrasada': 'bg-danger',
    'Esperando fecha': 'bg-light text-dark border'
  };

  const iconosEstado = {
    'En proceso': '▶️',
    'En pausa': '⏸',
    'Atrasada': '⚠️',
    'Esperando fecha': '⏳'
  };

  // ==========================================
  // 3. ESTADOS DE LA APLICACIÓN
  // ==========================================
  // Gestión de Tickets y Filtros
  const [busqueda, setBusqueda] = useState('');
  const [clientesLista, setClientesLista] = useState([]);
  const [ingresandoNuevoCliente, setIngresandoNuevoCliente] = useState(false);
  const [ordenTickets, setOrdenTickets] = useState('desc');
  const [filtros, setFiltros] = useState({
      estados: [],     
      origenes: [],
      categorias: [],
      prioridades: []
  });
  const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);
  // Si es null, están todos cerrados. Si dice 'origen', se abre el de origen.
  const [menuAbierto, setMenuAbierto] = useState(null);

  // Paginación de Tickets
  const [paginaActual, setPaginaActual] = useState(1);
  const ticketsPorPagina = 10;

  // Gestión de Usuarios
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [mostrarModalUsuarios, setMostrarModalUsuarios] = useState(false);
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [areaUsuario, setAreaUsuario] = useState(localStorage.getItem('area_usuario') || '');
  const [listaRoles, setListaRoles] = useState([]);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [historialSeleccionado, setHistorialSeleccionado] = useState([]); 

  // Historial por Tarea (Modal Nuevo)
  const [mostrarModalHistorialTarea, setMostrarModalHistorialTarea] = useState(false);
  const [tareaIdHistorial, setTareaIdHistorial] = useState(null);
  // Navegación (Pestañas)
  const [pestañaActual, setPestañaActual] = useState('tickets');

  //filtros de tareas 
  const [ordenTareas, setOrdenTareas] = useState('proxima'); // Por defecto ordena por fecha
  
  // ==========================================
  // 4. GESTIÓN DE SESIÓN
  // ==========================================


  useEffect(() => {
    editandoIdRef.current = editandoId;
  }, [editandoId]);

  // ==========================================
  // 5. ESTADO DERIVADO Y CÁLCULOS
  // ==========================================
  


  // ==========================================
  // 6. EFECTOS DE CARGA Y WEBSOCKETS
  // ==========================================

  // Efecto para la carga inicial de datos desde la API
  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        // Obtenemos todos los datos en paralelo para hacer la carga más rápida
        const [respuestaTickets, respuestaClientes, respuestaTareas, respuestaAreas, respuestaRoles, respuestaUsuario] = await Promise.all([
          fetch(`${URL_API}/tickets?id_rol=${encodeURIComponent(rolUsuario)}&id_area=${encodeURIComponent(areaUsuario)}&solicitante=${encodeURIComponent(usuario)}`),
          fetch(`${URL_API}/clientes`),
          fetch(`${URL_API}/tareas`),
          fetch(`${URL_API}/usuarios/areas`),
          fetch(`${URL_API}/usuarios/roles`),
          fetch(`${URL_API}/usuarios`)
        ]);
        
        if (respuestaTickets.ok) setTickets(await respuestaTickets.json());
        if (respuestaClientes.ok) setClientesLista(await respuestaClientes.json());
        if (respuestaTareas.ok) setTareas(await respuestaTareas.json());
        if (respuestaAreas.ok) setAreasDisponibles(await respuestaAreas.json());
        if (respuestaRoles.ok) setListaRoles(await respuestaRoles.json());
        if (respuestaUsuario.ok) setUsuariosLista(await respuestaUsuario.json());
        
        cargarIndicadores();
      } catch (error) {
        toast.error("Error al cargar los datos del servidor.");
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []); // <-- Se ejecuta solo una vez al montar el componente

  // Efecto independiente para manejar las conexiones WebSockets en tiempo real
  useEffect(() => {
    // ==================================================
    // WEBSOCKETS: GESTIÓN DE TICKETS Y BITÁCORA
    // ==================================================

    // 1. Escuchar creación de nuevos ticketstick
   const manejarTicketCreado = (nuevoTicket) => {
        // 1. Aseguramos que todo sea un número entero (parseInt)
        const miRol = parseInt(localStorage.getItem('rol_usuario') || rolUsuario);
        const miArea = parseInt(localStorage.getItem('area_usuario') || areaUsuario);
        const miNombre = localStorage.getItem('nombre_usuario') || usuario;

        // 2. Agregamos al Coordinador General (23) a la lista de VIPs
        const esAdminOTecnico = miRol === 1 || miRol === 2 || miRol === 23;
        
        // 3. Comparamos contra la nueva columna id_area del backend
        const esDeMiArea = nuevoTicket.id_area === miArea;
        const loCreeYo = nuevoTicket.solicitante === miNombre;

        if (esAdminOTecnico || esDeMiArea || loCreeYo) {
        setTickets((ticketsAnteriores) => {
          // Filtro anti-duplicados
          const yaExiste = ticketsAnteriores.some(t => t.id === nuevoTicket.id);
          if (yaExiste) return ticketsAnteriores;
          
          // Agregamos el nuevo ticket arriba de todo
          return [nuevoTicket, ...ticketsAnteriores];
        });

        // Alerta sonora (solo si no lo creé yo)
        if (nuevoTicket.solicitante !== miNombre) {
          new Audio(sonidoAlerta).play().catch(() => {});
        }
      }
    };

    // 2. Escuchar modificaciones de estado o datos de tickets
    const manejarTicketModificado = (ticketEditado) => {
      setTickets((ticketsAnteriores) => 
        ticketsAnteriores.map(t => t.id === ticketEditado.id ? ticketEditado : t)
      );
    };

    // 3. Escuchar nuevos comentarios (Bitácora)
    const manejarNuevoComentario = (comentarioNuevo) => {
      const miNombre = localStorage.getItem('nombre_usuario') || usuario;
      
      // Alerta sonora (solo si el mensaje es de otra persona)
      if (comentarioNuevo.autor !== miNombre) {
        new Audio(sonidoAlerta).play().catch(() => {});
      }

      // Si tenemos abierto el modal de este ticket, actualizamos el chat en vivo
      if (editandoIdRef.current === comentarioNuevo.ticket_id) {
        setComentarios(prev => [...prev, comentarioNuevo]);
      } else {
        // Si el chat no está abierto, agregamos el puntito de notificación en la tabla
        setTicketsConMensaje(prev => {
          if (!prev.includes(comentarioNuevo.ticket_id)) {
            return [...prev, comentarioNuevo.ticket_id];
          }
          return prev;
        });
      }
    };

    // ==================================================
    // WEBSOCKETS: GESTIÓN DE RUTINAS Y TAREAS
    // ==================================================

    const manejarTareaCreada = (nuevaTarea) => {
      cargarIndicadores();
      setTareas((tareasAnteriores) => {
        const yaExiste = tareasAnteriores.some(t => t.id === nuevaTarea.id);
        if (yaExiste) return tareasAnteriores;
        // Ordenamos las rutinas por su próxima hora de ejecución
        return [...tareasAnteriores, nuevaTarea].sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
    };

    const manejarTareaCompletada = (tareaActualizada) => {
      setTareas((tareasAnteriores) => {
        const nuevasTareas = tareasAnteriores.map(t => t.id === tareaActualizada.id ? tareaActualizada : t);
        return nuevasTareas.sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
    };

    const manejarTareaModificada = (tareaActualizada) => {
      setTareas((tareasAnteriores) => {
        const nuevasTareas = tareasAnteriores.map(t => t.id === tareaActualizada.id ? tareaActualizada : t);
        return nuevasTareas.sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
    };

    const manejarTareaEliminada = (idTareaEliminada) => {
      setTareas((tareasAnteriores) => tareasAnteriores.filter(t => t.id !== idTareaEliminada));
    };

    // ==================================================
    // WEBSOCKETS: GESTIÓN DE CLIENTES EXTERNOS
    // ==================================================

    const manejarClienteCreado = (nuevoCliente) => {
      setClientesLista((prevLista) => {
        const existe = prevLista.find(c => c.id === nuevoCliente.id);
        if (existe) return prevLista;
        return [...prevLista, nuevoCliente].sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
    };

    // Registramos todos los 'escuchadores' al socket
    socket.on('ticketCreado', manejarTicketCreado);
    socket.on('ticketModificado', manejarTicketModificado);
    socket.on('nuevoComentario', manejarNuevoComentario);
    
    socket.on('tareaCreada', manejarTareaCreada);       
    socket.on('tareaCompletada', manejarTareaCompletada);   
    socket.on('tareaModificada', manejarTareaModificada);
    socket.on('tareaEliminada', manejarTareaEliminada);
    
    socket.on('clienteCreado', manejarClienteCreado);

    // Función de limpieza: Se ejecuta al desmontar el componente para evitar duplicaciones
    return () => {
      socket.off('ticketCreado', manejarTicketCreado);
      socket.off('ticketModificado', manejarTicketModificado);
      socket.off('nuevoComentario', manejarNuevoComentario);
      
      socket.off('tareaCreada', manejarTareaCreada);       
      socket.off('tareaCompletada', manejarTareaCompletada);   
      socket.off('tareaModificada', manejarTareaModificada);
      socket.off('tareaEliminada', manejarTareaEliminada);
      
      socket.off('clienteCreado', manejarClienteCreado);
    };  
  }, []); // <-- El array vacío asegura que las antenas se conecten una sola vez al cargar

  // Efecto para hacer scroll al final de los comentarios del chat
  useEffect(() => {
    if (finalDelChatRef.current) {
      finalDelChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios]);

  // ==========================================
  // 7. FUNCIONES HANDLERS (MODALES Y DATOS)
  // ==========================================

  const exportarTicketsExcel = () => {
    if (!tickets || tickets.length === 0) {
      toast.error("No hay tickets en el sistema para exportar.");
      return;
    }

    const datosParaExcel = tickets.map(ticket => ({
      "Código": ticket.codigo || `TK-${ticket.id}`,
      "Asunto": ticket.asunto,
      "Solicitante": ticket.solicitante,
      "Origen / Cliente": ticket.tipo_origen === 'Externo' ? (ticket.cliente || 'Externo') : 'Interno',
      "Categoría IT": ticket.categoria,
      "Prioridad": ticket.prioridad,
      "Estado": ticket.estado,
      "Técnico Asignado": ticket.tecnico_asignado || 'Sin asignar',
      "Fecha de Creación": ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString('es-AR') : 'Sin registro',
      "Fecha de Finalización": ticket.fecha_finalizado ? new Date(ticket.fecha_finalizado).toLocaleString('es-AR') : 'N/A'
    }));

    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Todos los Tickets");
    XLSX.writeFile(libro, "Reporte_Completo_Tickets_CruzDeMalta.xlsx");
    
    toast.success("¡Excel generado con los registros!");
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

  // ==========================================
  // 8. FILTRADO, ESTADÍSTICAS Y PAGINACIÓN
  // ==========================================
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter(ticket => {
      if (ticket.estado === 'Cerrado Definitivo') return false;

      // Buscador general (asunto, código, solicitante, cliente)
      if (busqueda.trim() !== '') {
        const bLower = busqueda.toLowerCase();
        const coincideBusqueda = 
          (ticket.asunto || '').toLowerCase().includes(bLower) ||
          (ticket.solicitante || '').toLowerCase().includes(bLower) ||
          (ticket.cliente || '').toLowerCase().includes(bLower) ||
          (ticket.codigo || '').toLowerCase().includes(bLower);
        if (!coincideBusqueda) return false;
      }

      // Filtros por Categoría, Prioridad, Estado, Origen
      if (filtros.categorias?.length > 0 && !filtros.categorias.includes(ticket.categoria)) return false;
      if (filtros.prioridades?.length > 0 && !filtros.prioridades.includes(ticket.prioridad)) return false;
      if (filtros.estados?.length > 0 && !filtros.estados.includes(ticket.estado)) return false;
      if (filtros.origenes?.length > 0 && !filtros.origenes.includes(ticket.tipo_origen || 'Interno')) return false;

      return true;
    });
  }, [tickets, busqueda, filtros]);

 // ==========================================
  // LÓGICA DE ORDENAMIENTO (Menú Desplegable)
  // ==========================================
  const ticketsOrdenados = useMemo(() => {
    return [...ticketsFiltrados].sort((a, b) => {
      if (ordenTickets === 'fecha_desc') {
        // Usamos el ID en lugar de la fecha. ¡El ID más grande siempre es el más nuevo!
        return b.id - a.id; 
      }
      if (ordenTickets === 'fecha_asc') {
        return a.id - b.id; // El ID más chico es el más antiguo
      }
      if (ordenTickets === 'prioridad') {
        const peso = { 'Urgente': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 };
        return (peso[b.prioridad] || 0) - (peso[a.prioridad] || 0); // Urgentes arriba
      }
      if (ordenTickets === 'estado') {
        const peso = { 'Abierto': 1, 'En Proceso': 2, 'Resuelto': 3, 'Cerrado Definitivo': 4 };
        return (peso[a.estado] || 0) - (peso[b.estado] || 0); // Abiertos arriba
      }
      return 0;
    });
  }, [ticketsFiltrados, ordenTickets]);

  // ==========================================
  // LÓGICA DE MANEJO DE CHECKBOX PARA FILTROS MULTPLES
  // ==========================================
  const toggleFiltro = (tipo, valor) => {
    setFiltros(prev => {
        const seleccionado = prev[tipo].includes(valor);
        return {
            ...prev,
            // Si ya estaba, lo saca. Si no estaba, lo agrega al array.
            [tipo]: seleccionado 
                ? prev[tipo].filter(item => item !== valor) 
                : [...prev[tipo], valor]
        };
    });
};

  // ==========================================
  // LÓGICA DE PAGINACIÓN
  // ==========================================
  const indiceUltimoTicket = paginaActual * ticketsPorPagina;
  const indicePrimerTicket = indiceUltimoTicket - ticketsPorPagina;
  
  // Si sos Admin (1), Técnico (2) o Coordinador Gral (23), ves toda la lista ordenada.
  // Si sos un usuario final, el filtro solo deja pasar los tickets que vos creaste.

  const ticketsParaLaTabla = useMemo(() => {
    if (esAdmin || esTecnico|| esCoordinadorGral) {
      return ticketsOrdenados;
    }
    
    if (esCoordinadorArea) {
      // El coordinador general solo ve los tickets de su área en la tabla
      return ticketsOrdenados.filter(t => t.id_area === parseInt(areaUsuario));
    }
    
    // Usuario final: solo ve los suyos (creados por él)
    return ticketsOrdenados.filter(t => {
        const solicitanteLimpio = (t.solicitante || '').toLowerCase().trim();
        const usuarioLimpio = (usuario || '').toLowerCase().trim();
        return solicitanteLimpio === usuarioLimpio;
    });
  }, [ticketsOrdenados, esAdmin, esTecnico, esCoordinadorGral, esCoordinadorArea, usuario, areaUsuario]);

  const ticketsPaginados = ticketsParaLaTabla.slice(indicePrimerTicket, indiceUltimoTicket);
    
    // 3. Calculamos cuántas páginas hay en total basados en lo que realmente puede ver
    const totalPaginas = Math.ceil(ticketsParaLaTabla.length / ticketsPorPagina);
    

  // Si el usuario busca algo o aplica un filtro y los resultados bajan, lo devolvemos a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtros]);

  const ticketsAbiertos = useMemo(() => tickets.filter(t => t.estado === 'Abierto').length, [tickets]);
  const ticketsEnProceso = useMemo(() => tickets.filter(t => t.estado === 'En Proceso').length, [tickets]);
  const ticketsResueltos = useMemo(() => tickets.filter(t => t.estado === 'Resuelto').length, [tickets]);
  const totalTickets = ticketsAbiertos + ticketsEnProceso + ticketsResueltos;  
  
  const datosEstado = useMemo(() => [
    { name: 'Abiertos', value: ticketsAbiertos },
    { name: 'En Proceso', value: ticketsEnProceso },
    { name: 'Resueltos', value: ticketsResueltos },
  ], [ticketsAbiertos, ticketsEnProceso, ticketsResueltos]);
  
  const COLORES_ESTADO = ['#dc3545', '#ffc107', '#198754']; 

  const conteoCategorias = useMemo(() => {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.categoria] = (acc[ticket.categoria] || 0) + 1;
      return acc;
    }, {});
  }, [tickets]);
  
  const datosCategoria = useMemo(() => {
    return Object.keys(conteoCategorias).map(key => ({
      name: key,
      cantidad: conteoCategorias[key]
    }));
  }, [conteoCategorias]);

  const cambiarAreaUsuario = async (idUsuario, nuevaArea) => {
    try {
      const res = await fetch(`/api/usuarios/${idUsuario}/area`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: nuevaArea })
      });
      
      if (res.ok) {
        const usuarioActualizado = await res.json();
        
        setUsuariosLista((prev) => prev.map(u => u.id === idUsuario ? usuarioActualizado : u));
        
        const nombreLogueado = localStorage.getItem('nombre_usuario');
        
        if (usuarioActualizado.nombre === nombreLogueado) {
          localStorage.setItem('area_usuario', usuarioActualizado.area);
          
          setAreaUsuario(usuarioActualizado.area); 
        }
        
      }
    } catch (error) {
      console.error("Error cambiando área", error);
    }
  };
  
  const manejarNuevoTicket = () => {
    abrirModalCrear(); 
    setIngresandoNuevoCliente(false); 
  };
  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    // Le damos 100 milisegundos a React para que dibuje las 10 filas nuevas antes de viajar
    setTimeout(() => {
      if (tablaTicketsRef.current) {
        // block: 'start' alinea la tabla justo en la parte superior de tu pantalla
        tablaTicketsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };


  // ==========================================
  // LÓGICA DE FILTRADO PARA TAREAS / RUTINAS
  // ==========================================
  const tareasFiltradas = useMemo(() => {
    // 1. Primero filtramos (lo que ya tenías)
    let resultado = tareas.filter((tarea) => {
        const busquedaLower = busquedaTarea.toLowerCase();
        const coincideBusqueda = 
            tarea.titulo?.toLowerCase().includes(busquedaLower) ||
            tarea.descripcion?.toLowerCase().includes(busquedaLower) ||
            tarea.categoria?.toLowerCase().includes(busquedaLower) ||
            tarea.frecuencia?.toLowerCase().includes(busquedaLower) ||
            tarea.estado?.toLowerCase().includes(busquedaLower);

        const coincideCategoria = filtroCategoriaTarea === 'Todas' || tarea.categoria === filtroCategoriaTarea;
        return coincideBusqueda && coincideCategoria;
    });

    // 2. Después ordenamos según el nuevo estado
  resultado.sort((a, b) => {
        // 1. ORDEN POR CATEGORÍA
        if (ordenTareas === 'categoria') {
            const catA = a.categoria || "";
            const catB = b.categoria || "";
            return catA.localeCompare(catB);
        }

        // 2. ORDEN POR NOMBRE
        if (ordenTareas === 'nombre') {
            const nombreA = a.nombre_rutina || a.titulo || "";
            const nombreB = b.nombre_rutina || b.titulo || "";
            return nombreA.localeCompare(nombreB);
        }

        // --- HELPER DE FECHAS ROBUSTO ---
        const obtenerTiempo = (fechaStr) => {
            if (!fechaStr) return Infinity;
            // Si es formato DB (YYYY-MM-DD)
            if (fechaStr.includes('-')) return new Date(fechaStr).getTime();
            // Si es formato Tabla (DD/MM/YYYY HH:mm)
            const parts = fechaStr.split(/[\/\s:]/);
            if (parts.length >= 5) {
                const [d, m, y, hh, mm] = parts;
                return new Date(y, m - 1, d, hh, mm).getTime();
            }
            const ms = new Date(fechaStr).getTime();
            return isNaN(ms) ? Infinity : ms;
        };

        const tiempoA = obtenerTiempo(a.proxima_ejecucion);
        const tiempoB = obtenerTiempo(b.proxima_ejecucion);
        const ahora = new Date().getTime();

        // 3. ORDEN POR PRÓXIMA EJECUCIÓN (Estrictamente Cronológico)
        if (ordenTareas === 'proxima') {
            return tiempoA - tiempoB;
        }

        // 4. EL ORDEN (ATRASADA > PROCESO > PAUSA > PENDIENTE)
        if (ordenTareas === 'atrasadas') {
            
            // Función interna que asigna el "peso" (1 al 5) según el estado
            const obtenerPrioridad = (tarea, tiempo) => {
                const estado = (tarea.estado || "").toUpperCase();
                
                // PRIORIDAD 1: ATRASADAS (Fecha vieja y NO están activas ni finalizadas)
                if (tiempo < ahora && estado !== 'EN CURSO' && estado !== 'EN PROCESO' && estado !== 'PAUSADA' && estado !== 'EN PAUSA' && estado !== 'FINALIZADA') {
                    return 1;
                }
                
                // PRIORIDAD 2: EN PROCESO
                if (estado === 'EN CURSO' || estado === 'EN PROCESO') return 2;
                
                // PRIORIDAD 3: EN PAUSA
                if (estado === 'PAUSADA' || estado === 'EN PAUSA') return 3;
                
                // PRIORIDAD 5: FINALIZADAS (Las mandamos al fondo de la tabla)
                if (estado === 'FINALIZADA') return 5;
                
                // PRIORIDAD 4: EMPEZAR / PROXIMAS (Todo lo que está pendiente a futuro)
                return 4;
            };

            const prioridadA = obtenerPrioridad(a, tiempoA);
            const prioridadB = obtenerPrioridad(b, tiempoB);

            // Primero ordenamos por nuestro sistema de pesos (1 gana, 5 pierde)
            if (prioridadA !== prioridadB) {
                return prioridadA - prioridadB; 
            }
            
            // DESEMPATE: Si dos tareas tienen el mismo peso (ej: ambas son Prioridad 1),
            // ponemos arriba la que tenga la fecha más vieja.
            return tiempoA - tiempoB;
        }

        return 0;
    });

    return resultado;
}, [tareas, busquedaTarea, filtroCategoriaTarea, ordenTareas]); // 👈 Importante agregar ordenTareas aquí
  
  // ==========================================
  // 10. TAREAS: Logica de TAREAS y RUTINAS
  // ==========================================
    // HELPER UNIVERSAL PARA PARSEAR FECHAS DE TAREAS
    const obtenerTiempo = (fechaStr) => {
        if (!fechaStr) return Infinity;
        // Si es formato DB (YYYY-MM-DD)
        if (fechaStr.includes('-')) return new Date(fechaStr).getTime();
        
        // Si es formato Tabla (DD/MM/YYYY HH:mm o D/M/YYYY)
        const parts = fechaStr.split(/[\/\s:]/);
        if (parts.length >= 3) { // Al menos día, mes y año
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1; // Los meses en JS empiezan en 0
            const y = parseInt(parts[2], 10);
            const hh = parts[3] ? parseInt(parts[3], 10) : 0;
            const mm = parts[4] ? parseInt(parts[4], 10) : 0;
            return new Date(y, m, d, hh, mm).getTime();
        }
        
        const ms = new Date(fechaStr).getTime();
        return isNaN(ms) ? Infinity : ms;
    };
    const tareasTotales = tareas.length;
    // 1. Lo que ya se terminó (Contador Verde)
    const rutinasFinalizadas = tareas.filter(t => fueCompletadaHoy(t.ultima_vez_completada)).length;

    // 2. Lo que falta terminar hoy (para repartir en los demás)
    const tareasPendientesHoy = tareas.filter(t => !fueCompletadaHoy(t.ultima_vez_completada));

    const hoy = new Date();
    // --- REPARTO DE PENDIENTES ---

    // EN CURSO: Solo las que están activas ahora
    const rutinasEnProceso = tareasPendientesHoy.filter(t => t.estado === 'En Curso').length;

    // PAUSADAS: Las que se empezaron pero se frenaron (Nuevo contador si querés, o restarlas de Proceso)
    const rutinasPausadas = tareasPendientesHoy.filter(t => t.estado === 'Pausada').length;
    // ATRASADAS: No están terminadas Y ya pasó la hora Y no se han iniciado/pausado
    const rutinasAtrasadas = tareasPendientesHoy.filter(t => {
        const tiempoTarea = obtenerTiempo(t.proxima_ejecucion);
        const ahora = new Date().getTime();

        return tiempoTarea < ahora &&
           t.estado !== 'Pausada' &&
           t.estado !== 'En Curso';
    }).length;

    // PRÓXIMAS: No están terminadas, no están pausadas Y falta para que venzan
    const rutinasProximas = tareasPendientesHoy.filter(t => {
    return t.proxima_ejecucion && 
           new Date(t.proxima_ejecucion) >= hoy && 
           t.estado !== 'Pausada' && 
           t.estado !== 'En Curso';
    }).length;

    const abrirHistorialTarea = (tarea) => {
        setTareaIdHistorial(tarea.id);
        setMostrarModalHistorialTarea(true);
    };

    const handleVerHistorialGlobal = async () => {
        try {
            // Llamamos a la ruta sin ID, que nos devuelve TODO el historial
            const response = await fetch(`${URL_API}/tareas/historial`);
            
            if (response.ok) {
                const data = await response.json();
                setHistorialSeleccionado(data);
                setMostrarModalHistorial(true); // Reutilizamos tu mismo modal
            } else {
                toast.error("Error al obtener el historial global");
            }
        } catch (error) {
            console.error("Error de red:", error);
            toast.error("Error de conexión al servidor");
        }
    };

  // ===============
  // ===========================
  // 11. RENDERIZADO DEL COMPONENTE (UI)
  // ==========================================
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
              🙋🏼 Hola, <strong>{usuario}</strong> <span className="text-info ms-1">({areasDisponibles.find(a => a.id === parseInt(areaUsuario))?.nombre || areaUsuario})</span>
              <span className="badge bg-secondary ms-2">
                {listaRoles.find(r => r.id === parseInt(rolUsuario))?.nombre || 'CARGANDO...'}
              </span>
            </span>
            {rolUsuario === ROLES.ADMIN && (
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
        <button 
          className={`nav-link text-dark ${pestañaActual === 'tickets' ? 'active fw-bold border-bottom-0 shadow-sm' : 'bg-light border'}`} 
          onClick={() => setPestañaActual('tickets')}
        >
          🎫 Soporte IT
        </button>
      </li>
      
      {(parseInt(rolUsuario) === ROLES.ADMIN || parseInt(rolUsuario) === ROLES.TECNICO) &&  (
            <li className="nav-item">
              <button 
                className={`nav-link text-dark d-flex align-items-center ${pestañaActual === 'tareas' ? 'active fw-bold border-bottom-0 shadow-sm' : 'bg-light border'}`} 
                onClick={() => setPestañaActual('tareas')}
              >
                📋 Tareas Rutinarias 
                
                {/* 🔴 EL GLOBITO DE NOTIFICACIÓN EN LA PESTAÑA */}
                {indicadores?.cantidadNuevas > 0 && (
                  <span className="badge bg-danger rounded-pill ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                    {indicadores.cantidadNuevas}
                  </span>
                )}
              </button>      
            </li>
          )}
        </ul>
        {/* ====================================================  */}
        {/* VISTA 1: TICKETS                                      */}
        {/* ====================================================  */}
        {pestañaActual === 'tickets' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
          
          {parseInt(rolUsuario) === ROLES.TECNICO &&(
            <h2 className="h3 text-secondary">Tickets</h2>
          )|| parseInt(rolUsuario) === ROLES.USUARIO_FINAL &&(
            <h2 className="h3 text-secondary">Mis Incidencias</h2>
          )}
          <div className="d-flex gap-2">
            {parseInt(rolUsuario) === ROLES.ADMIN && (
              <button className="btn btn-success fw-bold shadow-sm" onClick={exportarTicketsExcel}>
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

        {parseInt(rolUsuario) === ROLES.ADMIN && (
          <div className="row mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-secondary m-0">📊 Dashboard de Tickets (Administrador)</h3>
            </div>
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
        
        {(parseInt(rolUsuario) === ROLES.ADMIN || parseInt(rolUsuario) === ROLES.COORDINADOR_GRAL) && (
          <>
              <DashboardAgustin 
              tickets={tickets} 
              tareas={tareas}
              obtenerTiempo={obtenerTiempo}
              fueCompletadaHoy={fueCompletadaHoy}
              usuarioLogueado={usuario}
              indicadoresTareas={{
                atrasadas: rutinasAtrasadas,
                proceso: rutinasEnProceso,
                pausa: rutinasPausadas,
                proximas: rutinasProximas,
                finalizadas: rutinasFinalizadas
              }}
              />
              
          </>
           
           )}
           
        {(parseInt(rolUsuario) === ROLES.ADMIN ) && (
          <div className="row mb-4">
            <div className="col-12 col-md-6 col-lg-3 mb-3">
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
            <div className="col-12 col-md-6 col-lg-3 mb-3">
              <div className="card shadow-sm h-100 border-0 p-3">
                <h6 className="text-center fw-bold text-secondary mb-3">Incidencias por Categoría</h6>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={datosCategoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      
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

        {/* 10. Filtros Globales (Disponibles para todos los usuarios) */}
        <div className="row mb-3 gx-2">
         
          {/* align-items-stretch hace que todos compartan exactamente el mismo alto */}
          <div className="d-flex flex-wrap align-items-center  gap-2 mb-3">        
    
                {/* 1. Buscador (Queda igual, es perfecto) */}
                <div className="input-group shadow-sm" style={{ width: '250px' }}>
                    <span className="input-group-text bg-white border-end-0">🔍</span>
                    <input type="text" className="form-control border-start-0" placeholder="Buscar ticket..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
                {/* EL ESCUDO INVISIBLE: Solo aparece si hay un menú abierto y cubre toda la pantalla por detrás del menú */}
                {menuAbierto && (
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }} 
                        onClick={() => setMenuAbierto(null)}
                    />
                )}
                {/* ========================================= */}
                {/* 2. Filtro de ORIGEN */}
                {/* ========================================= */}
                <div className="dropdown" style={{ position: 'relative', zIndex: menuAbierto === 'origen' ? 1050 : 1045 }}>
                    <button 
                        className="btn btn-outline-secondary bg-white text-dark d-flex align-items-center gap-2" 
                        type="button" 
                        // Si ya está abierto y le hago clic, lo cierro (null). Si no, abro 'origen'.
                        onClick={() => setMenuAbierto(menuAbierto === 'origen' ? null : 'origen')}
                    >
                        <span className="fw-bold text-secondary small">Origen</span>
                        {filtros.origenes?.length > 0 && <span className="badge bg-primary">{filtros.origenes.length}</span>}
                        <span style={{ fontSize: '0.8em' }}>▼</span>
                    </button>
                    
                    {/* Cambiamos la condición para mostrar el menú */}
                    {menuAbierto === 'origen' && (
                        <ul className="dropdown-menu show p-2 shadow" style={{ display: 'block', position: 'absolute', minWidth: '180px' }}>
                            {[
                                { id: 'Interno', label: '🏢 Interno' },
                                { id: 'Externo', label: '🤝 Externo' }
                            ].map(opcion => (
                                <li key={opcion.id}>
                                    <label className="dropdown-item d-flex align-items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" className="form-check-input m-0"
                                            checked={filtros.origenes.includes(opcion.id)}
                                            onChange={() => toggleFiltro('origenes', opcion.id)}
                                        />
                                        {opcion.label}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ========================================= */}
                {/* 3. Filtro de CATEGORÍA (Dropdown Multiselect) */}
                {/* ========================================= */}
                <div className="dropdown" style={{ position: 'relative', zIndex: menuAbierto === 'categoria' ? 1050 : 1045 }}>
                    <button 
                        className="btn btn-outline-secondary bg-white text-dark d-flex align-items-center gap-2" 
                        type="button" 
                        onClick={() => setMenuAbierto(menuAbierto === 'categoria' ? null : 'categoria')}
                    >
                        <span className="fw-bold text-secondary small">Categoría</span>
                        {filtros.categorias.length > 0 && <span className="badge bg-primary">{filtros.categorias.length}</span>}
                        <span style={{ fontSize: '0.8em' }}>▼</span>
                    </button>
                    
                    {menuAbierto === 'categoria' && (
                        <ul className="dropdown-menu show p-2 shadow" style={{ display: 'block', position: 'absolute', zIndex: 1050, minWidth: '220px' }}>
                            {[
                                { id: 'Redes e Internet', label: '🌐 Redes e Internet' },
                                { id: 'Active Directory / Accesos', label: '🔑 Active Directory / Accesos' },
                                { id: 'Hardware e Insumos', label: '💻 Hardware e Insumos' },
                                { id: 'Software y SO', label: '💽 Software y SO' },
                                { id: 'CCTV', label: '📹 CCTV' },
                                { id: 'Reportes', label: '📄 Reportes' },
                                { id: 'Mantenimiento', label: '🔧 Mantenimiento' },
                                { id: 'Porgramas/Aplicaciones', label: '🗄️ Porgramas/Aplicaciones' },
                            ].map(opcion => (
                                <li key={opcion.id}>
                                    <label className="dropdown-item d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" className="form-check-input m-0"
                                            checked={filtros.categorias.includes(opcion.id)}
                                            onChange={() => toggleFiltro('categorias', opcion.id)}
                                        />
                                        {opcion.label}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ========================================= */}
                {/* 4. Filtro de PRIORIDAD (Dropdown Multiselect) */}
                {/* ========================================= */}
              <div className="dropdown" style={{ position: 'relative', zIndex: menuAbierto === 'prioridad' ? 1050 : 1045 }}>
                  <button 
                      className="btn btn-outline-secondary bg-white text-dark d-flex align-items-center gap-2" 
                      type="button" 
                      onClick={() => setMenuAbierto(menuAbierto === 'prioridad' ? null : 'prioridad')}
                  >
                      <span className="fw-bold text-secondary small">Prioridad</span>
                      {filtros.prioridades.length > 0 && <span className="badge bg-primary">{filtros.prioridades.length}</span>}
                      <span style={{ fontSize: '0.8em' }}>▼</span>
                  </button>
                  
                  {menuAbierto === 'prioridad' && (
                      <ul className="dropdown-menu show p-2 shadow" style={{ display: 'block', position: 'absolute', zIndex: 1050, minWidth: '150px' }}>
                          {[
                              { id: 'Baja', label: '🟢 Baja' },
                              { id: 'Media', label: '🟡 Media' },
                              { id: 'Alta', label: '🟠 Alta' },
                              { id: 'Urgente', label: '🔴 Urgente' }
                          ].map(opcion => (
                              <li key={opcion.id}>
                                  <label className="dropdown-item d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                                      <input 
                                          type="checkbox" className="form-check-input m-0"
                                          checked={filtros.prioridades.includes(opcion.id)}
                                          onChange={() => toggleFiltro('prioridades', opcion.id)}
                                      />
                                      {opcion.label}
                                  </label>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>

              <div className="dropdown" style={{ position: 'relative', zIndex: menuAbierto === 'prioridad' ? 1050 : 1045 }}>
                  <button 
                      className="btn btn-outline-secondary bg-white text-dark d-flex align-items-center gap-2" 
                      type="button" 
                      onClick={() => setMenuAbierto(menuAbierto === 'estado' ? null : 'estado')}
                  >
                      <span className="fw-bold text-secondary small">Estado</span>
                      {filtros.estados.length > 0 && <span className="badge bg-primary">{filtros.estados.length}</span>}
                      <span style={{ fontSize: '0.8em' }}>▼</span>
                  </button>
                  
                  {menuAbierto === 'estado' && (
                      <ul className="dropdown-menu show p-2 shadow" style={{ display: 'block', position: 'absolute', zIndex: 1050, minWidth: '200px' }}>
                          {['Abierto', 'En Proceso', 'Resuelto'].map(estado => (
                              <li key={estado}>
                                  <label className="dropdown-item d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                                      <input 
                                          type="checkbox" 
                                          className="form-check-input m-0"
                                          checked={filtros.estados.includes(estado)}
                                          onChange={() => toggleFiltro('estados', estado)}
                                      />
                                      {estado}
                                  </label>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
               {/* 5. Ordenar Por */}
              <div className="col-md-3">
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-dark text-white fw-bold" style={{fontSize: '0.85rem'}}>Ordenar por</span>
                  <select className="form-select border-dark" value={ordenTickets} onChange={(e) => setOrdenTickets(e.target.value)}>
                    <option value="fecha_desc">🕒 Más Recientes</option>
                    <option value="fecha_asc">⏳ Más Antiguos</option>
                    <option value="prioridad">🚨 Prioridad (Urgentes primero)</option>
                    <option value="estado">📊 Estado (Abiertos primero)</option>
                  </select>
                </div>
              </div>
              {/* 6. Botón Histórico */}
              <div className="" style={{ position: 'relative', zIndex: menuAbierto === 'prioridad' ? 1050 : 1045 }}>
                <button 
                    className="btn btn-outline-secondary fw-bold shadow-sm d-flex align-items-center"
                    type="button"
                    onClick={() => setMostrarModalHistorico(true)}
                >
                    🗄️ Histórico de Tickets
                </button>
              </div>
            </div>
        </div>
        
        
        <div className="card shadow-sm" ref={tablaTicketsRef}>
          {/* <div className="card-body p-0 table-responsive" style={{ minHeight: '650px' }}> */}
          <div className="card-body p-0 table-responsive">
            <table className="table table-hover mb-0 text-center align-middle" style={{ fontSize: '0.9rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Origen</th>
                  {(esAdmin || esTecnico || esCoordinadorGral || esCoordinadorArea) && (
                  <th>Solicitante / Cliente</th>
                  )}
                  <th>Asunto</th>
                  <th>Categoría</th>
                  <th>Prioridad</th>
                  <th>Técnico</th> 
                  <th>Estado</th>
                  <th>Acciones</th> 
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="10">Cargando...</td></tr>
                ) : ticketsPaginados.length > 0 ? (ticketsPaginados.map((ticket) => (
                
                   <tr key={ticket.id} title={ticket.descripcion} 
                    style={{ cursor: 'pointer' }}>
                      {/* 1. Código */}
                      
                      <td className="fw-bold">{ticket.codigo}</td>
                      
                      {/* 2. Origen */}
                      <td>
                        <span className={`badge ${ticket.tipo_origen === 'Externo' ? 'bg-purple text-white border border-purple' : 'bg-info text-dark'} `} style={{ backgroundColor: ticket.tipo_origen === 'Externo' ? '#6f42c1' : '' }}>
                          {ticket.tipo_origen || 'Interno'}
                        </span>
                      </td>
                      
                       {(esAdmin || esTecnico || esCoordinadorGral || esCoordinadorArea) && (        
                        <td>
                          {ticket.tipo_origen === 'Externo' ? (
                            <>
                              <span className="fw-bold" style={{ color: '#6f42c1' }}>
                                🏢 {ticket.cliente || 'Sin cliente'}
                              </span>
                              <br/>
                              <small className="text-muted">
                                👤 {ticket.solicitante || 'Usuario'}
                              </small>
                            </>
                          ) : (
                            <span>👤 {ticket.solicitante || 'Usuario'}</span>
                          )}
                        </td>
)}
                      {/* 4. Asunto */}
                      <td>{ticket.asunto}
                        
                      </td>
                      
                      {/* 5. Categoría */}
                      <td>{ticket.categoria}</td>
                      
                      {/* 5b. Prioridad */}
                      <td>
                        <span className={`badge shadow-sm ${
                          ticket.prioridad === 'Urgente' ? 'bg-danger animate__animated animate__pulse animate__infinite' :
                          ticket.prioridad === 'Alta'    ? 'bg-warning text-dark' :
                          ticket.prioridad === 'Media'   ? 'bg-primary' :
                                                          'bg-light text-dark border'
                        }`}>
                          {ticket.prioridad === 'Urgente' && '🚨 '}
                          {ticket.prioridad === 'Alta' && '⚠️ '}
                          {ticket.prioridad === 'Media' && '🔷 '}
                          {ticket.prioridad === 'Baja' && '🍃 '}
                          {ticket.prioridad}
                        </span>
                      </td>
                      
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
                      <td>
                        {ticket.estado === 'Cerrado Definitivo' ? (
                          <div className="d-flex justify-content-center align-items-center gap-2">
                             <span className="badge bg-light text-dark border p-2">🔒 Archivado</span>
                             <button className="btn btn-secondary btn-sm text-white shadow-sm" title="Ver Historial" onClick={() => abrirModalEditar(ticket)}>
                               👁️ Ver
                             </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-center align-items-center gap-1">
                             {(parseInt(rolUsuario) === ROLES.TECNICO || parseInt(rolUsuario) === ROLES.ADMIN ) && (
                               <select className="form-select form-select-sm border-secondary shadow-sm" style={{ width: '105px' }} value={ticket.estado} onChange={(e) => cambiarEstadoTicket(ticket.id, e.target.value)}>
                                 <option value="Abierto">Abierto</option>
                                 <option value="En Proceso">En Proceso</option>
                                 <option value="Resuelto" className="fw-bold text-success">Resuelto</option>
                               </select>
                             )}
                             {(parseInt(rolUsuario) === ROLES.TECNICO || parseInt(rolUsuario) === ROLES.ADMIN) && (
                               <button className="btn btn-info btn-sm text-white" title="Asignarme a mí" onClick={() => asignarmeTicket(ticket.id)}>🙋‍♂️</button>
                             )}   
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
                             {(parseInt(rolUsuario) === ROLES.ADMIN || ticket.solicitante === (usuario || localStorage.getItem('nombre_usuario'))) && (
                               <button 
                                 className="btn btn-danger btn-sm" 
                                 title="Eliminar Ticket"
                                 onClick={() => eliminarTicket(ticket.id)}
                               >
                                 🗑️
                               </button>
                             )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))) : (
                    <tr>
                      <td colSpan="10" className="text-muted py-3 text-center">No hay tickets registrados.</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
        {/* CONTROLES DE PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted small">
              Mostrando {indicePrimerTicket + 1} a {Math.min(indiceUltimoTicket, ticketsFiltrados.length)} de {ticketsFiltrados.length} tickets
            </span>
            <div className="btn-group shadow-sm">
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={() => cambiarPagina(Math.max(paginaActual - 1, 1))}
                disabled={paginaActual === 1}
              >
                ⬅️ Anterior
              </button>
              
              <span className="btn btn-secondary btn-sm disabled text-white fw-bold">
                Página {paginaActual} de {totalPaginas}
              </span>
              
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={() => cambiarPagina(Math.min(paginaActual + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente ➡️
              </button>
            </div>
          </div>
        )}
          </div>
        )}
        {/* ==================================================== */}
        {/* VISTA 2: NUEVA PANTALLA DE TAREAS RECURRENTES          */}
        {/* ==================================================== */}
        {(parseInt(rolUsuario) === ROLES.ADMIN || parseInt(rolUsuario) === ROLES.TECNICO) && pestañaActual === 'tareas' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex gap-2 mb-3">
                {parseInt(rolUsuario) === ROLES.ADMIN && (
                  <>
                    {parseInt(rolUsuario) === ROLES.ADMIN && (
                      <DropdownReporte exportarHistorialTareas={exportarHistorialTareas} />
                    )}  
                    
                  </>
                )}
                
                <button className="btn btn-primary shadow-sm" onClick={() => { 
                  setFormularioTarea({id: null, titulo: '', categoria: 'Limpieza / General', frecuencia: 'Dias Especificos', hora_programada: '09:00', dias_especificos: [], fecha_unica: ''}); 
                  setMostrarModalTarea(true); 
                }}>
                  + Nuevo
                </button>
                <button className="btn btn-secondary fw-bold shadow-sm" onClick={handleVerHistorialGlobal}>
                      🗄️ Ver Historial Global
                    </button>
              </div>
            <TableroTareas 
                tareas={tareasFiltradas}
                iniciarTarea={iniciarTarea}
                pausarTarea={pausarTarea}
                setTareaSeleccionadaFinalizar={setTareaSeleccionadaFinalizar}
                setMostrarModalFinalizar={setMostrarModalFinalizar}
                formatearFrecuenciaTexto={formatearFrecuenciaTexto}
                indicadores={indicadores}
                marcarComoVista={marcarComoVista}
                asignarTarea={asignarTarea}
                esAdmin={esAdmin}
                abrirModalEditarTarea={abrirModalEditarTarea}
                usuarioLogueado={usuario?.nombre || usuario}
                usuariosLista={usuariosLista}
                abrirHistorialTarea={abrirHistorialTarea}
            />
          </div>
        )}

        {/* --- MODALES DE TAREAS --- */}
        {mostrarModalHistorialTarea && (
          <ModalHistorialTarea 
            mostrar={mostrarModalHistorialTarea}
            setMostrar={setMostrarModalHistorialTarea}
            tareaId={tareaIdHistorial}
            URL_API={URL_API}
          />
        )}
      {VistaCarga}
      {/* Renderizamos el Modal solo si el estado es true */}
      {mostrarModalHistorico && (
          <ModalHistorico 
              tickets={tickets} // Le pasás tu lista completa de tickets cruda
              cerrarModal={() => setMostrarModalHistorico(false)} 
              areasDisponibles={areasDisponibles}
              abrirModalTicket={abrirModalEditar}
          />
      )}
      {mostrarModalHistorial && (
                <ModalHistoricoTareas 
                    historial={historialSeleccionado} 
                    cerrarModal={() => setMostrarModalHistorial(false)} 
                    URL_API={URL_API}
                />
            )}
      </main>
      {/* BLOQUE DE MODALES EXTERNOS */}
      <ModalTicket 
        mostrarModal={mostrarModal} setMostrarModal={setMostrarModal}
        editandoId={editandoId} setEditandoId={setEditandoId}
        formulario={formulario} manejarCambio={manejarCambio} setFormulario={setFormulario}
        esSoloLectura={esSoloLectura} guardarTicket={guardarTicket}
        ingresandoNuevoCliente={ingresandoNuevoCliente} setIngresandoNuevoCliente={setIngresandoNuevoCliente}
        clientesLista={clientesLista} comentarios={comentarios}
        nuevoComentario={nuevoComentario} setNuevoComentario={setNuevoComentario}
        enviarComentario={enviarComentario} rolUsuario={rolUsuario}
        finalDelChatRef={finalDelChatRef}
        usuarioLogueado={usuario}
        listaRoles={listaRoles}
        listaUsuarios={usuariosLista}
        archivosTicketNuevo={archivosTicketNuevo} 
        setArchivosTicketNuevo={setArchivosTicketNuevo}
        URL_API={URL_API}
      />
      <ModalUsuarios 
        mostrarModalUsuarios={mostrarModalUsuarios} setMostrarModalUsuarios={setMostrarModalUsuarios}
        rolUsuario={rolUsuario} usuariosLista={usuariosLista} cambiarRolUsuario={cambiarRolUsuario}
        cambiarAreaUsuario={cambiarAreaUsuario}
        areasDisponibles={areasDisponibles}
        listaRoles={listaRoles}
        cerrarModal={() => setMostrarModalUsuarios(false)}
        URL_API={URL_API}
      />
      <ModalTarea 
        mostrarModalTarea={mostrarModalTarea} setMostrarModalTarea={setMostrarModalTarea}
        formularioTarea={formularioTarea} setFormularioTarea={setFormularioTarea}
        manejarDias={manejarDias} guardarTarea={guardarTarea}
        URL_API={URL_API}
      />
      <ModalFinalizarTarea 
        mostrar={mostrarModalFinalizar} 
        setMostrar={setMostrarModalFinalizar}
        tarea={tareaSeleccionadaFinalizar}
        marcarTareaCompletada={marcarTareaCompletada}
        usuariosLista={usuariosLista}
        rolUsuario={rolUsuario}
        usuarioLogueado={usuario}
        indicadores={indicadores}
        marcarComoVista={marcarComoVista}
        asignarTarea={asignarTarea}
        esAdmin={esAdmin}
        URL_API={URL_API}
      />
    </motion.div>
  );
}
