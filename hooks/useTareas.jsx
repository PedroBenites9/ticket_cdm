import { useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const useTareas = (URL_API, usuario, mostrarCarga, ocultarCarga) => {
  // 1. ESTADOS
  const [tareas, setTareas] = useState([]);
  const [mostrarModalTarea, setMostrarModalTarea] = useState(false);
  const [formularioTarea, setFormularioTarea] = useState({
    titulo: '', categoria: 'Limpieza / General', frecuencia: 'Diaria', hora_programada: '09:00', dias_especificos: [], fecha_unica: ''
  });

  // 2. FUNCIONES DE LÓGICA
  const manejarDias = (diaId) => {
    const { dias_especificos } = formularioTarea;
    if (dias_especificos.includes(diaId)) {
      setFormularioTarea({ ...formularioTarea, dias_especificos: dias_especificos.filter(d => d !== diaId) });
    } else {
      setFormularioTarea({ ...formularioTarea, dias_especificos: [...dias_especificos, diaId] });
    }
  };

  const guardarTarea = async (e) => {
    e.preventDefault();
    mostrarCarga();
    try {
      const respuesta = await fetch(`${URL_API}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formularioTarea) 
      });
      const tareaCreada = await respuesta.json();
      setTareas(prev => [...prev, tareaCreada].sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion)));
      setMostrarModalTarea(false);
      toast.success("¡Rutina programada con éxito!");
    } catch (error) {
      toast.error("Error al crear la rutina.");
    } finally {
      ocultarCarga();
    }
  };

  const marcarTareaCompletada = async (id) => {
    try {
      const respuesta = await fetch(`${URL_API}/tareas/${id}/completar`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario }) 
      });
      if (!respuesta.ok) throw new Error("El servidor falló al completar la tarea");
      
      const tareaActualizada = await respuesta.json();
      console.log("🕵️‍♂️ TAREA QUE LLEGÓ DEL BACKEND:", tareaActualizada);
      setTareas(prev => {
        const nuevasTareas = prev.map(t => t.id === id ? tareaActualizada : t);
        return nuevasTareas.sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
      toast.success("¡Excelente! Tarea completada. Quedó reprogramada.");
    } catch (error) {
      toast.error("Error al actualizar la rutina.");
    }
  };

  const iniciarTarea = async (id) => {
    try {
      await fetch(`${URL_API}/tareas/${id}/iniciar`, { method: 'PUT' });
      toast.success("▶ Cronómetro iniciado. ¡A trabajar!");
    } catch (error) {
      toast.error("Error al iniciar la tarea.");
    }
  };

  const pausarTarea = async (id) => {
    try {
      await fetch(`${URL_API}/tareas/${id}/pausar`, { method: 'PUT' });
      toast.warning("⏸ Tarea pausada. El tiempo se ha guardado.");
    } catch (error) {
      toast.error("Error al pausar la tarea.");
    }
  };

  const eliminarTarea = async (idTabla) => {
    const confirmar = window.confirm("¿Estás seguro de eliminar esta rutina definitivamente? Se borrará todo su historial.");
    if (confirmar) {
      try {
        const respuesta = await fetch(`${URL_API}/tareas/${idTabla}`, { method: 'DELETE' });
        if (!respuesta.ok) throw new Error("Fallo en servidor");
        setTareas(prev => prev.filter((tarea) => tarea.id !== idTabla));
        toast.error("🗑️ Rutina eliminada del sistema."); 
      } catch (error) {
        toast.error("Error al intentar eliminar.");
      }
    }
  };

  const exportarHistorialTareas = async () => {
    try {
      const respuesta = await fetch(`${URL_API}/tareas/historial`);
      const datosHistorial = await respuesta.json();
      if (datosHistorial.length === 0) {
        toast.error("Aún no hay tareas completadas para exportar.");
        return;
      }
      const datosParaExcel = datosHistorial.map(registro => ({
        "ID Tarea": registro.tarea_id,
        "Rutina Realizada": registro.titulo_tarea,
        "Completado Por": registro.usuario_que_completo,
        "Fecha de Inicio": registro.fecha_inicio ? new Date(registro.fecha_inicio).toLocaleDateString() : 'Sin registro',
        "Hora de Inicio": registro.fecha_inicio ? new Date(registro.fecha_inicio).toLocaleTimeString() : 'Sin registro',
        "Fecha de Finalización": new Date(registro.fecha_completada).toLocaleDateString(),
        "Hora de Finalización": new Date(registro.fecha_completada).toLocaleTimeString(),
        "Tiempo de Ejecución Real": registro.tiempo_total_minutos ? `${Math.round(registro.tiempo_total_minutos)} min` : 'Sin registro'
      }));  
      const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Métricas de Rutinas");
      XLSX.writeFile(libro, "Métricas_Mantenimiento_CruzDeMalta.xlsx");
      toast.success("¡Reporte de métricas descargado!");
    } catch (error) {
      toast.error("Error al generar el Excel de tareas.");
    }
  };

  const calcularTiempoTarea = (tarea) => {
    if (!tarea || !tarea.proxima_ejecucion) return "";
    const fecha = new Date(tarea.proxima_ejecucion);
    const difMs = fecha - new Date();
    if (difMs <= 0) return "⚠️ Atrasada"; 
    
    const horas = Math.floor(difMs / (1000 * 60 * 60));
    const minutos = Math.floor((difMs % (1000 * 60 * 60)) / (1000 * 60));
    const dias = Math.floor(horas / 24);
    const horaExacta = tarea.hora_programada?.substring(0, 5) || "00:00";

    if (dias >= 1) return `🗓️ ${fecha.toLocaleDateString()} (${horaExacta})`;
    return `Faltan ${horas}h ${minutos}m`;
  };

  const fueCompletadaHoy = (fechaString) => {
    if (!fechaString) return false;
    const fechaCompletada = new Date(fechaString);
    const hoy = new Date();
    return fechaCompletada.getDate() === hoy.getDate() &&
           fechaCompletada.getMonth() === hoy.getMonth() &&
           fechaCompletada.getFullYear() === hoy.getFullYear();
  };

  // 3. EXPORTAMOS LO QUE MAIN.JSX NECESITA
  return {
    tareas, setTareas,
    mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea,
    manejarDias, guardarTarea, marcarTareaCompletada,
    iniciarTarea, pausarTarea, eliminarTarea,
    exportarHistorialTareas, calcularTiempoTarea, fueCompletadaHoy
  };
};