// React y Bibliotecas de UI
import { useState, useEffect, useRef } from 'react';
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

//Dashboard Agustin
import { DashboardAgustin } from './ComponenteAgustin';

const socket = io(import.meta.env.VITE_URL_BACKEND || '/');

export default function Main({ cambiarVista, usuario }) {
  // ==========================================
  // 1. HOOKS PRINCIPALES
  // ==========================================
  const { mostrarCarga, ocultarCarga, VistaCarga } = useCarga();
  const URL_API = import.meta.env.VITE_URL_API || '/api';
  const rolUsuario = localStorage.getItem('rol_usuario') || 'final';

  // Hook de Tareas
  const [filtroCategoriaTarea, setFiltroCategoriaTarea] = useState('Todas');
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [tareaSeleccionadaFinalizar, setTareaSeleccionadaFinalizar] = useState(null);

  const {
    tareas, setTareas, mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea, manejarDias, guardarTarea, 
    marcarTareaCompletada, iniciarTarea, pausarTarea, eliminarTarea,
    exportarHistorialTareas, calcularTiempoTarea, fueCompletadaHoy, esTareaFutura, formatearFrecuenciaTexto, abrirModalEditarTarea,
    indicadores, cargarIndicadores, marcarComoVista
  } = useTareas(URL_API, usuario, mostrarCarga, ocultarCarga);

  // Hook de Tickets
  const {
    tickets, setTickets, cargando, setCargando, mostrarModal, setMostrarModal,
    editandoId, setEditandoId, comentarios, setComentarios, nuevoComentario, setNuevoComentario,
    ticketsConMensaje, setTicketsConMensaje, formulario, setFormulario,
    editandoIdRef, finalDelChatRef, esSoloLectura, obtenerColorEstado, calcularTiempoRestante,
    manejarCambio, abrirModalCrear, abrirModalEditar, enviarComentario,
    guardarTicket, cambiarEstadoTicket, asignarmeTicket, eliminarTicket, 
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
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroOrigen, setFiltroOrigen] = useState('Todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas');
  const [clientesLista, setClientesLista] = useState([]);
  const [ingresandoNuevoCliente, setIngresandoNuevoCliente] = useState(false);
  const [ordenTickets, setOrdenTickets] = useState('desc');
  const [verHistorico, setVerHistorico] = useState(false);
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

  // Navegación (Pestañas)
  const [pestañaActual, setPestañaActual] = useState('tickets');


  // ==========================================
  // 4. GESTIÓN DE INACTIVIDAD Y SESIÓN
  // ==========================================
  const cerrarSesionAuto = () => {
    localStorage.removeItem('token_acceso'); 
    localStorage.removeItem('nombre_usuario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('area_usuario');
    localStorage.removeItem('horaLogin');
    toast.warning("⏱️ Tu sesión ha expirado por seguridad.");
    cambiarVista('login');
  };

  useEffect(() => {
    let ultimoRegistro = Date.now();
    const registrarActividad = () => {
      const ahora = Date.now();
      if (ahora - ultimoRegistro > 2000) {
        localStorage.setItem('ultimaActividad', ahora);
        ultimoRegistro = ahora;
      }
    };
    localStorage.setItem('ultimaActividad', Date.now());
    window.addEventListener('mousemove', registrarActividad);
    window.addEventListener('keydown', registrarActividad);
    window.addEventListener('click', registrarActividad);
    window.addEventListener('scroll', registrarActividad);

    const patrullero = setInterval(() => {
      const ultimaVez = parseInt(localStorage.getItem('ultimaActividad') || Date.now());
      const tiempoActual = Date.now();
      const limiteInactividad = 30 * 60 * 1000;
      if (tiempoActual - ultimaVez > limiteInactividad) {
        cerrarSesionAuto();
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', registrarActividad);
      window.removeEventListener('keydown', registrarActividad);
      window.removeEventListener('click', registrarActividad);
      window.removeEventListener('scroll', registrarActividad);
      clearInterval(patrullero);
    };
  }, []);



  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const res = await fetch('/api/usuarios/areas');
        if (res.ok) {
          const data = await res.json();
          setAreasDisponibles(data);
        }
      } catch (error) {
        console.error("Error cargando áreas", error);
      }
    };
    cargarAreas();
  }, []);

  useEffect(() => {
    editandoIdRef.current = editandoId;
  }, [editandoId]);

  useEffect(() => {
    const traerRoles = async () => {
        try {
            const response = await fetch(`${URL_API}/usuarios/roles`);
            const data = await response.json();
            setListaRoles(data); // ¡Acá se llena el tanque!
            
        } catch (error) {
            console.error("Error al traer los roles:", error);
        }
    };

    traerRoles();
}, []);
  // ==========================================
  // 5. ESTADO DERIVADO Y CÁLCULOS
  // ==========================================
  // Filtramos todas las tareas que NO fueron completadas hoy
  const tareasActivas = tareas.filter(t => !fueCompletadaHoy(t.ultima_vez_completada));
  
  const totalPendientes = tareasActivas.length;
  const rutinasEnProceso = tareasActivas.filter(t => t.estado === 'En Curso').length;
  const rutinasAtrasadas = tareasActivas.filter(t => new Date(t.proxima_ejecucion) < new Date()).length;
  
  // Las finalizadas son únicamente las que YA se hicieron hoy
  const rutinasFinalizadas = tareas.filter(t => fueCompletadaHoy(t.ultima_vez_completada)).length;
  
  // Hook para hacer "latir" a React cada 1 minuto
  const [ticker, setTicker] = useState(0);

  // ==========================================
  // 6. EFECTOS DE CARGA Y WEBSOCKETS
  // ==========================================
      useEffect(() => {
        // Actualiza el estado 'ticker' cada 60.000 ms (1 minuto)
        const intervalo = setInterval(() => setTicker(t => t + 1), 60000);
        return () => clearInterval(intervalo); // Limpieza cuando se cierra la pantalla
    }, []);

  useEffect(() => {
    // 1. Carga inicial tradicional (una sola vez)
    const obtenerDatos = async () => {
      try {
        const respuestaTickets = await fetch(`${URL_API}/tickets?rol=${encodeURIComponent(rolUsuario)}&area=${encodeURIComponent(areaUsuario)}`);
        setTickets(await respuestaTickets.json());
        const respuestaClientes = await fetch(`${URL_API}/clientes`);
        setClientesLista(await respuestaClientes.json());
        const respuestaTareas = await fetch(`${URL_API}/tareas`);
        setTareas(await respuestaTareas.json());
        cargarIndicadores();
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
      // 1. REGLA DE PRIVACIDAD (La que ya teníamos)
      const miRol = rolUsuario || localStorage.getItem('rol_usuario');
      const miArea = areaUsuario || localStorage.getItem('area_usuario');
      const miNombre = usuario || localStorage.getItem('nombre_usuario');

      const esAdminOTecnico = miRol === 'admin' || miRol === 'tecnico';
      const esDeMiArea = nuevoTicket.area_origen === miArea;
      const loCreeYo = nuevoTicket.solicitante === miNombre;
      if (esAdminOTecnico || esDeMiArea || loCreeYo) {
        
        // 2. FILTRO ANTI-DUPLICADOS (La solución al problema)
        setTickets((ticketsAnteriores) => {
          // ¿Ya tengo un ticket con este ID en mi lista?
          const yaExiste = ticketsAnteriores.some(t => t.id === nuevoTicket.id);
          
          // Si ya existe, devuelvo la lista como estaba (no hago nada)
          if (yaExiste) {
            return ticketsAnteriores;
          }
          
          // Si es realmente nuevo, lo agrego arriba de todo
          return [nuevoTicket, ...ticketsAnteriores];
        });

        // 3. SONIDO (Solo si no lo creé yo)
        if (nuevoTicket.solicitante !== usuario) {
          new Audio(sonidoAlerta).play().catch(e => {});
        }
      }
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
      cargarIndicadores();
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



  // ==========================================
  // 7. FUNCIONES HANDLERS (MODALES Y DATOS)
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

  const ticketsFiltrados = tickets.filter(ticket => {
    // 1. Evitamos errores si algún texto viene nulo o indefinido
    const asuntoSafe = ticket.asunto || '';
    const codigoSafe = ticket.codigo || '';
    const areaSafe = ticket.area_origen || '';
    const solicitanteSafe = ticket.solicitante || '';

    // 2. Filtros de la barra superior (Múltiple Selección)
    const matchBusqueda = !busqueda || asuntoSafe.toLowerCase().includes(busqueda.toLowerCase()) || codigoSafe.toLowerCase().includes(busqueda.toLowerCase());

    // 💡 Función salvavidas: Convierte todo a minúsculas y le corta los espacios extra
    const limpiarTexto = (texto) => (texto || '').toString().toLowerCase().trim();

    // 2. Filtros de la barra superior (Multiselect a prueba de balas)
    const matchOrigen = !filtros.origenes?.length || 
        filtros.origenes.some(filtro => limpiarTexto(ticket.tipo_origen || ticket.origen) === limpiarTexto(filtro));

    const matchCategoria = !filtros.categorias?.length || 
        filtros.categorias.some(filtro => limpiarTexto(ticket.categoria) === limpiarTexto(filtro));

    const matchPrioridad = !filtros.prioridades?.length || 
        filtros.prioridades.some(filtro => limpiarTexto(ticket.prioridad) === limpiarTexto(filtro));

    const matchEstado = !filtros.estados?.length || 
        filtros.estados.some(filtro => limpiarTexto(ticket.estado) === limpiarTexto(filtro));

    // REGLA DE ORO: En la tabla principal NUNCA mostramos los Cerrados Definitivos
    const matchNoEsHistorico = ticket.estado !== 'Cerrado Definitivo';

    // 3. Filtro de Privacidad (Capa 2) ¡Inmune a mayúsculas y espacios extras!
    const miRol = (rolUsuario || localStorage.getItem('rol_usuario') || '').toLowerCase().trim();
    const miArea = (localStorage.getItem('area_usuario') || '').toLowerCase().trim();
    const miNombre = (usuario || localStorage.getItem('nombre_usuario') || '').toLowerCase().trim();

    const esAdminOTecnico = miRol === 'admin' || miRol === 'tecnico';
    const esDeMiArea = areaSafe.toLowerCase().trim() === miArea;
    const loCreeYo = solicitanteSafe.toLowerCase().trim() === miNombre;

    const matchPrivacidad = esAdminOTecnico || esDeMiArea || loCreeYo;

    // Solo se muestra en la tabla si pasa todas las pruebas
    return matchBusqueda && matchNoEsHistorico && matchOrigen && matchCategoria && matchPrioridad && matchEstado && matchPrivacidad;
  });

 // ==========================================
  // LÓGICA DE ORDENAMIENTO (Menú Desplegable)
  // ==========================================
  const ticketsOrdenados = [...ticketsFiltrados].sort((a, b) => {
    
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
  
 // 1. Filtramos los tickets ordenados para que el Coordinador solo vea los suyos
  const ticketsParaLaTabla = rolUsuario === 'coordinador'
      ? ticketsOrdenados.filter(t => 
        t.solicitante === usuario)
      : ticketsOrdenados;

  // 2. Paginamos sobre la lista restringida
  const ticketsPaginados = ticketsParaLaTabla.slice(indicePrimerTicket, indiceUltimoTicket);

  // 3. Calculamos cuántas páginas hay en total basados en lo que realmente puede ver
  const totalPaginas = Math.ceil(ticketsParaLaTabla.length / ticketsPorPagina);

  // Si el usuario busca algo y los resultados bajan, lo devolvemos a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroCategoria, filtroOrigen]);

  const ticketsAbiertos = tickets.filter(t => t.estado === 'Abierto').length;
  const ticketsEnProceso = tickets.filter(t => t.estado === 'En Proceso').length;
  const ticketsResueltos = tickets.filter(t => t.estado === 'Resuelto').length;
  const totalTickets = ticketsAbiertos + ticketsEnProceso + ticketsResueltos;  
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
  const tareasFiltradas = tareas.filter((tarea) => {
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
  
  // ==========================================
  // 10. RENDERIZADO DEL COMPONENTE (UI)
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
        <button 
          className={`nav-link text-dark ${pestañaActual === 'tickets' ? 'active fw-bold border-bottom-0 shadow-sm' : 'bg-light border'}`} 
          onClick={() => setPestañaActual('tickets')}
        >
          🎫 Soporte IT
        </button>
      </li>
      
      {(rolUsuario === 'admin' || rolUsuario === 'tecnico') &&  (
            <li className="nav-item">
              <button 
                className={`nav-link text-dark d-flex align-items-center ${pestañaActual === 'tareas' ? 'active fw-bold border-bottom-0 shadow-sm' : 'bg-light border'}`} 
                onClick={() => setPestañaActual('tareas')}
              >
                🔄 Mantenimiento y Rutinas
                
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

        {(rolUsuario === 'admin' ) && (
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

        {(rolUsuario?.toLowerCase() === 'admin' || areaUsuario?.toLowerCase() === 'coordinador gral.') && (
              <DashboardAgustin tickets={tickets}/>
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
                      {filtros.prioridades.length > 0 && <span className="badge bg-primary">{filtros.prioridades.length}</span>}
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
                  {(rolUsuario === 'admin' || rolUsuario === 'tecnico') && (
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
                             {(rolUsuario === 'admin' || ticket.solicitante === (usuario || localStorage.getItem('nombre_usuario'))) && (
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
                  setFormularioTarea({id: null, titulo: '', categoria: 'Limpieza / General', frecuencia: 'Dias Especificos', hora_programada: '09:00', dias_especificos: [], fecha_unica: ''}); 
                  setMostrarModalTarea(true); 
                }}>
                  + Nuevo
                </button>
              </div>

            <div className="row mt-4 mb-4">
              <div className="col-md-3 col-6 mb-3">
                <div className="card bg-secondary text-white text-center shadow-sm h-100 border-0">
                  <div className="card-body py-3">
                    <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Pendientes Totales</h6>
                    <h3 className="mb-0 fw-bold">{totalPendientes}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card bg-warning text-dark text-center shadow-sm h-100 border-0">
                  <div className="card-body py-3">
                    <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>En Curso</h6>
                    <h3 className="mb-0 fw-bold">{rutinasEnProceso}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card bg-danger text-white text-center shadow-sm h-100 border-0">
                  <div className="card-body py-3">
                    <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Atrasadas</h6>
                    <h3 className="mb-0 fw-bold animate__animated animate__pulse animate__infinite">{rutinasAtrasadas}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card bg-success text-white text-center shadow-sm h-100 border-0">
                  <div className="card-body py-3">
                    <h6 className="card-title mb-1 text-uppercase fw-bold" style={{ fontSize: '0.8rem' }}>Finalizadas Hoy</h6>
                    <h3 className="mb-0 fw-bold">{rutinasFinalizadas}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="card shadow-sm border-0">
              {/* NUEVO: Filtros y Buscador de Tareas */}
            <div className="d-flex flex-wrap gap-2 mt-4 mb-3">
              <button className={`btn btn-sm ${filtroCategoriaTarea === 'Todas' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFiltroCategoriaTarea('Todas')}>Todas</button>
              <button className={`btn btn-sm ${filtroCategoriaTarea === 'Limpieza / General' ? 'btn-info text-white' : 'btn-outline-info'}`} onClick={() => setFiltroCategoriaTarea('Limpieza / General')}>🧹 Limpieza</button>
              <button className={`btn btn-sm ${filtroCategoriaTarea === 'CCTV y Servidores' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setFiltroCategoriaTarea('CCTV y Servidores')}>📹 CCTV y Servidores</button>
              <button className={`btn btn-sm ${filtroCategoriaTarea === 'Redes' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFiltroCategoriaTarea('Redes')}>🌐 Redes</button>
              <button className={`btn btn-sm ${filtroCategoriaTarea === 'Reportes' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setFiltroCategoriaTarea('Reportes')}>📑 Reportes</button>
            </div>

            <div className="mb-3">
              <input 
                type="text" 
                className="form-control" 
                placeholder="🔍 Buscar rutina por nombre o descripción..." 
                value={busquedaTarea} 
                onChange={(e) => setBusquedaTarea(e.target.value)} 
              />
            </div>
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
                   {tareasFiltradas.length > 0 ? (tareasFiltradas.map(tarea => {
                        // Verificamos si la tarea ya se completó hoy
                        const completadaHoy = fueCompletadaHoy(tarea.ultima_vez_completada);
                        const tareaFutura = esTareaFutura(tarea.proxima_ejecucion);

                        let minutosMostrados = tarea.tiempo_acumulado_minutos || 0;
                        
                        // Si la tarea está corriendo, le sumamos la diferencia de tiempo en vivo
                        if (tarea.estado === 'En Curso' && tarea.fecha_inicio_real) {
                            // new Date() se actualiza gracias al "ticker" del Paso 1
                            const milisegundosPasados = new Date() - new Date(tarea.fecha_inicio_real);
                            const minutosExtra = milisegundosPasados / 1000 / 60;
                            
                            // Evitamos que muestre números negativos si hay un micro-desfase de servidor
                            if (minutosExtra > 0) {
                                minutosMostrados += minutosExtra;
                            }
                        }
                        return (
                          <tr 
                            key={tarea.id} 
                            // Si está completada, le bajamos la opacidad al 50% para el efecto difuminado
                            style={{ opacity: completadaHoy ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
                          >
                            {/* Tachamos el título si ya está lista */}
                            <td className={`fw-bold text-start ps-4 ${completadaHoy ? 'text-decoration-line-through text-muted' : ''}`}>
                              {tarea.titulo}
                              {indicadores?.idsNuevas?.includes(tarea.id) && (
                                <span className="badge bg-danger rounded-circle p-1 ms-2 d-inline-block" title="¡Tarea Nueva!" style={{ width: '10px', height: '10px' }}>
                                  <span className="visually-hidden">Tarea Nueva</span>
                                </span>
                              )}
                            </td>
                            <td><span className="badge bg-secondary">{tarea.categoria}</span></td>
                            <td className="text-secondary fw-semibold">
                              {formatearFrecuenciaTexto(tarea)} <span className="text-dark fw-normal">(⏰ {tarea.hora_programada?.substring(0, 5)})</span>
                            </td>
                           
                            <td>
                              <div className="d-flex flex-column align-items-center gap-1">
                                {completadaHoy ? (
                                  <span className="fw-bold px-2 py-1 rounded bg-success bg-opacity-75 text-white shadow-sm" style={{ fontSize: '0.85rem' }}>
                                    Próxima: {new Date(tarea.proxima_ejecucion).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                ) : (
                                  <>
                                    {/* 1. Mostramos la cuenta regresiva o la hora programada original */}
                                    <small className="text-muted fw-bold d-block mb-1">
                                      {tarea.estado_visual === 'Esperando fecha' 
                                        ? calcularTiempoTarea(tarea) 
                                        : `Prog: ${new Date(tarea.proxima_ejecucion).toLocaleDateString('es-AR')} ${tarea.hora_programada?.substring(0, 5)}`}
                                    </small>

                                    {/* 2. El badge dinámico SOLO aparece cuando hay un estado crítico o activo */}
                                    {tarea.estado_visual !== 'Esperando fecha' && (
                                      <span className={`badge ${coloresEstado[tarea.estado_visual]} shadow-sm px-2 py-1`} style={{ fontSize: '0.8rem' }}>
                                        {iconosEstado[tarea.estado_visual]} {tarea.estado_visual}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            {/* 5. Acciones y Botones del Cronómetro */}
                            <td className="align-middle">
                              {/* Contenedor principal: Columna vertical centrada */}
                              <div className="d-flex flex-column align-items-center gap-1">

                                <div className="d-flex align-items-center justify-content-center gap-2">
                                  
                                  {completadaHoy ? (
                                    <>
                                      <span className="badge bg-light text-success border border-success px-3 py-2 shadow-sm">
                                        ✔️ Lista por hoy
                                      </span>
                                      <button className="btn btn-outline-danger btn-sm shadow-sm" title="Eliminar Rutina" onClick={() => eliminarTarea(tarea.id)}>
                                        🗑️
                                      </button>
                                    </>
                                  ) : tareaFutura ? (
                                    <>
                                      <span className="badge bg-light text-secondary border px-3 py-2 shadow-sm">
                                        ⏳ Esperando fecha
                                      </span>
                                      <button className="btn btn-outline-danger btn-sm shadow-sm" title="Eliminar Rutina" onClick={() => eliminarTarea(tarea.id)}>
                                        🗑️
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Botón Iniciar */}
                                      {(!tarea.estado || tarea.estado === 'Pendiente' || tarea.estado === 'Pausada' || tarea.en_pausa == 1) && (
                                        <button 
                                          className="btn btn-primary btn-sm fw-bold shadow-sm px-3" 
                                          onClick={() => iniciarTarea(tarea.id)} 
                                          title="Iniciar o Reanudar tarea"
                                        >
                                          ▶ Iniciar
                                        </button>
                                      )}

                                      {/* Botón Pausar */}
                                      {(tarea.estado === 'En Curso' && !tarea.en_pausa) && (
                                        <button 
                                          className="btn btn-warning btn-sm text-dark fw-bold shadow-sm px-3" 
                                          onClick={() => pausarTarea(tarea.id)} 
                                          title="Pausar por una emergencia"
                                        >
                                          ⏸ Pausar
                                        </button>
                                      )}

                                      {/* Botón Finalizar */}
                                      <button 
                                        className={`btn ${tarea.estado === 'En Curso' ? 'btn-success' : 'btn-outline-success'} btn-sm fw-bold shadow-sm px-3`} 
                                        onClick={() => {
                                          setTareaSeleccionadaFinalizar(tarea);
                                          setMostrarModalFinalizar(true);
                                        }}
                                        title="Finalizar tarea"
                                      >
                                        ✅ Finalizar
                                      </button>
                                      
                                      {/* Botón Eliminar */}
                                      <button 
                                        className="btn btn-outline-danger btn-sm shadow-sm" 
                                        title="Eliminar Rutina" 
                                        onClick={() => eliminarTarea(tarea.id)}
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}

                                  {/* Botón Editar (Siempre visible y alineado al final) */}
                                  <button 
                                    className="btn btn-outline-warning btn-sm shadow-sm" 
                                    title="Editar Rutina" 
                                    onClick={() => abrirModalEditarTarea(tarea)}
                                  >
                                    ✏️
                                  </button>

                                </div>
                                {!completadaHoy && !tareaFutura && (tarea.estado === 'En Curso' || tarea.tiempo_acumulado_minutos >= 0) && (
                                  <div className="text-muted mt-1 text-center w-100" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    ⏱️ {Math.floor(minutosMostrados)} min dedicados
                                    {tarea.estado === 'En Curso' && !tarea.en_pausa && (
                                      <span className="ms-1 text-primary"> (corriendo...)</span>
                                    )}
                                  </div>
                                )}

                              </div>
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
      {/* Renderizamos el Modal solo si el estado es true */}
      {mostrarModalHistorico && (
          <ModalHistorico 
              tickets={tickets} // Le pasás tu lista completa de tickets cruda
              cerrarModal={() => setMostrarModalHistorico(false)} 
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
      />
    </motion.div>
  );
}