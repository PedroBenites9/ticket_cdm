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
    asunto: '', categoria: '', prioridad: 'Media', descripcion: '', tipo_origen: 'Interno', cliente:''
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
    let intervalo;
    if (editandoId) {
      intervalo = setInterval(() => {
        cargarComentarios(editandoId);
      }, 3000);
    }
    return () => clearInterval(intervalo);
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

  // FUNCIONES PRINCIPALES (CRUD)
  const manejarCambio = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const abrirModalCrear = () => {
    setFormulario({ asunto: '', categoria: '', prioridad: 'Media', descripcion: '', tipo_origen: 'Interno', cliente:''});
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
      descripcion: ticket.descripcion, tipo_origen: ticket.tipo_origen || 'Interno', cliente: ticket.cliente || ''
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
      const nombreReal = usuario || localStorage.getItem('nombre_usuario') || 'Usuario Desconocido';
      const paqueteAEnviar = { ...formulario, solicitante: nombreReal };
      if (editandoId) {
        const respuesta = await fetch(`${URL_API}/tickets/editar/${editandoId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paqueteAEnviar)
        });
        if (!respuesta.ok) throw new Error("Fallo en el servidor");
        const ticketActualizado = await respuesta.json();
        setTickets(prev => prev.map(t => t.id === editandoId ? ticketActualizado : t));
        toast.success("¡Ticket actualizado correctamente!");
      } else {
        const respuesta = await fetch(`${URL_API}/tickets`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paqueteAEnviar)
        });
        if (!respuesta.ok) throw new Error("Fallo en el servidor");
        const ticketCreado = await respuesta.json();
        
        // ✅ LA SOLUCIÓN: Revisamos si el WebSocket ya lo agregó antes de meterlo nosotros
        setTickets(prev => {
          const yaExiste = prev.some(t => t.id === ticketCreado.id);
          if (yaExiste) return prev; // Si ya está, no hacemos nada
          return [ticketCreado, ...prev]; // Si no está, lo agregamos
        });
        
        toast.success("¡Ticket generado correctamente!");
      }
      setMostrarModal(false);
      setEditandoId(null);
    } catch (error) {
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
        const respuesta = await fetch(`${URL_API}/tickets/${idTabla}`, { method: 'DELETE' });
        if (!respuesta.ok) throw new Error("Fallo en servidor");
        setTickets(prev => prev.filter((ticket) => ticket.id !== idTabla));
        toast.error("Ticket eliminado del sistema.");
      } catch (error) {
        toast.error("Error al intentar eliminar.");
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
    guardarTicket, cambiarEstadoTicket, asignarmeTicket, eliminarTicket
  };
};