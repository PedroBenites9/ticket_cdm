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
      const esEdicion = formularioTarea.id; // ¿Tiene ID? Entonces es edición
      const url = esEdicion ? `${URL_API}/tareas/${formularioTarea.id}` : `${URL_API}/tareas`;
      const metodo = esEdicion ? 'PUT' : 'POST';

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formularioTarea)
      });

      if (respuesta.ok) {
        toast.success(esEdicion ? "¡Rutina actualizada!" : "¡Nueva rutina creada!");
        setMostrarModalTarea(false);
        // Limpiamos el formulario (incluyendo el ID a null)
        setFormularioTarea({ id: null, titulo: '', categoria: 'Limpieza / General', frecuencia: 'Diaria', hora_programada: '09:00', dias_especificos: [], fecha_unica: '' });
      } else {
        toast.error("Error al guardar la tarea.");
      }
    } catch (error) {
      toast.error("Error de conexión al servidor.");
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

// NUEVO: Función para saber si la tarea está programada para mañana o más adelante
  const esTareaFutura = (fechaString) => {
    if (!fechaString) return false;
    
    const fechaTarea = new Date(fechaString);
    const hoy = new Date();
    
    // Igualamos las horas a cero para comparar solo los días en el calendario
    fechaTarea.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    
    // Si el día de la tarea es mayor al día de hoy, es del futuro
    return fechaTarea > hoy;
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

  // NUEVO: Traductor visual para la columna de Frecuencia
  const formatearFrecuenciaTexto = (tarea) => {
    // Si eligieron días específicos, traducimos los números a texto
    if (tarea.frecuencia === 'Dias Especificos') {
      try {
        // Nos aseguramos de que sea un array (dependiendo de cómo lo envíe PostgreSQL)
        const dias = typeof tarea.dias_especificos === 'string' 
            ? JSON.parse(tarea.dias_especificos) 
            : tarea.dias_especificos;
            
        if (!Array.isArray(dias) || dias.length === 0) return "Días sin asignar";

        const MAPA_DIAS = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
        return dias.map(d => MAPA_DIAS[d]).join(', '); // Ej: "Lun, Mié, Vie"
      } catch (e) {
        return "Días específicos";
      }
    }
    
    // Si eligieron una fecha única, la formateamos a DD/MM/YYYY
    if (tarea.frecuencia === 'Fecha Unica' && tarea.fecha_unica) {
      // Extraemos solo la parte YYYY-MM-DD para evitar problemas de zonas horarias
      const fechaLimpia = tarea.fecha_unica.split('T')[0]; 
      const [año, mes, dia] = fechaLimpia.split('-');
      return `${dia}/${mes}/${año}`;
    }

    // Si es Diaria, Semanal o Mensual, devolvemos el texto normal
    return tarea.frecuencia;
  };

  const abrirModalEditarTarea = (tarea) => {
  // Cargamos los datos exactos de la tarea en el formulario
  setFormularioTarea({
    id: tarea.id, // ¡Clave! El ID nos dirá que estamos editando
    titulo: tarea.titulo,
    categoria: tarea.categoria,
    frecuencia: tarea.frecuencia,
    hora_programada: tarea.hora_programada,
    dias_especificos: tarea.dias_especificos || [],
    fecha_unica: tarea.fecha_unica ? tarea.fecha_unica.split('T')[0] : ''
  });
  setMostrarModalTarea(true);
};

  // 3. EXPORTAMOS LO QUE MAIN.JSX NECESITA
  return {
    tareas, setTareas,
    mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea,
    manejarDias, guardarTarea, marcarTareaCompletada,
    iniciarTarea, pausarTarea, eliminarTarea,
    exportarHistorialTareas, calcularTiempoTarea, fueCompletadaHoy, esTareaFutura, formatearFrecuenciaTexto, abrirModalEditarTarea
  };
};