import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const useTickets = (URL_API, usuario, mostrarCarga, ocultarCarga) => {
  // ESTADOS
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [ticketsConMensaje, setTicketsConMensaje] = useState([]);
  const [formulario, setFormulario] = useState({
    asunto: '', categoria: '', prioridad: 'Media', descripcion: '', tipo_origen: 'Interno', cliente:'', 
  });
  // REFERENCIAS
  const editandoIdRef = useRef(null);
  const finalDelChatRef = useRef(null);

  // LÓGICA DE ESTADO LOCAL
  const ticketAbierto = tickets.find(t => t.id === editandoId);
  const esSoloLectura = ticketAbierto?.estado === 'Cerrado Definitivo';

  useEffect(() => {
    editandoIdRef.current = editandoId;
  }, [editandoId]);

  useEffect(() => {
    if (editandoId) {
      cargarComentarios(editandoId);
    }
  }, [editandoId]); 
 

  // FUNCIONES DE APOYO
  const obtenerColorEstado = (estado) => {
    if (estado === 'Abierto') return 'bg-danger';
    if (estado === 'En Proceso') return 'bg-warning text-dark';
    if (estado === 'Resuelto') return 'bg-success';
    if (estado === 'Cerrado Definitivo') return 'bg-dark text-white';
    return 'bg-secondary';
  };

  const calcularTiempoRestante = (fechaFinalizado) => {
    if (!fechaFinalizado) return "";
    const fechaFin = new Date(fechaFinalizado);
    fechaFin.setDate(fechaFin.getDate() + 5);
    const ahora = new Date();
    const diferenciaMs = fechaFin - ahora;

    if (diferenciaMs <= 0) return "Cierre inminente";
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenciaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return `${dias}d ${horas}h restantes`;
    return `${horas}h restantes`;
  };

  // FUNCIONES PRINCIPALES (CRUD)\
  const manejarCambio = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const abrirModalCrear = () => {
    setFormulario({ asunto: '', categoria: '', prioridad: 'Media',
      descripcion: '', tipo_origen: 'Interno', cliente:'', solicitante:''});
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
      asunto: ticket.asunto, categoria: ticket.categoria, prioridad: ticket.prioridad,
      descripcion: ticket.descripcion, tipo_origen: ticket.tipo_origen, solicitante: ticket.solicitante || 'Interno', cliente: ticket.cliente || ''
    });
    setEditandoId(ticket.id);
    cargarComentarios(ticket.id);
    setNuevoComentario('');
    setMostrarModal(true);
    setTicketsConMensaje(prev => prev.filter(id => id !== ticket.id));
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
    mostrarCarga();
    try {
      const nombreReal = usuario || localStorage.getItem('nombre_usuario');
      const areaReal = localStorage.getItem('area_usuario'); 

      const paqueteAEnviar = { 
        ...formulario, 
        solicitante: formulario.solicitante || nombreReal,
        usuario_actual: nombreReal // Necesario para que el backend valide edición de descripción
      };

      const url = editandoId ? `${URL_API}/tickets/editar/${editandoId}` : `${URL_API}/tickets`;
      const método = editandoId ? 'PUT' : 'POST';

      const respuesta = await fetch(url, {
        method: método,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paqueteAEnviar)
      });

      if (!respuesta.ok) throw new Error("Error en el servidor");
      
      setMostrarModal(false);
      setEditandoId(null); 
      toast.success(editandoId ? "¡Ticket actualizado!" : "¡Ticket generado!");

    } catch (error) {
      console.error(error);
      toast.error("Hubo un problema al procesar el ticket.");
    } finally {
      ocultarCarga();
    }
    
  };
  const cambiarEstadoTicket = async (idTabla, nuevoEstado) => {
    try {
      const respuesta = await fetch(`${URL_API}/tickets/${idTabla}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!respuesta.ok) throw new Error("Fallo en servidor");
      const ticketActualizadoBD = await respuesta.json();
      setTickets(prev => prev.map(t => t.id === idTabla ? ticketActualizadoBD : t));
      toast.success(nuevoEstado === 'Resuelto' ? "¡Ticket Finalizado!" : "Estado actualizado");
    } catch (error) {
      toast.error("Error al cambiar el estado.");
    }
  };

  const asignarmeTicket = async (idTabla) => {
    try {
      await fetch(`${URL_API}/tickets/asignar/${idTabla}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tecnico: usuario })
      });
      setTickets(prev => prev.map(t => t.id === idTabla ? { ...t, tecnico_asignado: usuario } : t));
      toast.success("Te has asignado este ticket.");
    } catch (error) {
      toast.error("Error al asignarse el ticket.");
    }
  };

  const eliminarTicket = async (idTabla) => {
  const confirmar = window.confirm("¿Estás seguro de eliminar este ticket?");
  if (confirmar) {
    try {
      const rol = localStorage.getItem('rol_usuario');
      const nombre = localStorage.getItem('nombre_usuario');
      
      const respuesta = await fetch(`${URL_API}/tickets/${idTabla}?rol=${rol}&nombre_usuario=${nombre}`, { 
        method: 'DELETE' 
      });

      if (!respuesta.ok) throw new Error("No tienes permisos o hubo un error");
      
      setTickets(prev => prev.filter((ticket) => ticket.id !== idTabla));
      toast.error("Ticket eliminado.");
    } catch (error) {
      toast.error("No se pudo eliminar el ticket.");
    }
  }
};

  // EXPORTAR HERRAMIENTAS
  return {
    tickets, setTickets, cargando, setCargando, mostrarModal, setMostrarModal,
    editandoId, setEditandoId, comentarios, setComentarios, nuevoComentario, setNuevoComentario,
    ticketsConMensaje, setTicketsConMensaje, formulario, setFormulario,
    editandoIdRef, finalDelChatRef, esSoloLectura, obtenerColorEstado, calcularTiempoRestante,
    manejarCambio, abrirModalCrear, abrirModalEditar, enviarComentario,
    guardarTicket, cambiarEstadoTicket, asignarmeTicket, eliminarTicket, 
  };
};