import { useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const useTareas = (URL_API, usuario, mostrarCarga, ocultarCarga) => {
  // 1. ESTADOS
  const [tareas, setTareas] = useState([]);
  const [mostrarModalTarea, setMostrarModalTarea] = useState(false);
  const [formularioTarea, setFormularioTarea] = useState({
    titulo: '', categoria: 'Limpieza / General', frecuencia: 'Dias Especificos', hora_programada: '00:00', dias_especificos: [], fecha_unica: '', descripcion: ''
  });  // CORREGIR: AL editar una tarea, se carga nuevamente esta linea de codigo 
  const [indicadores, setIndicadores] = useState({ cantidadNuevas: 0, idsNuevas: [], atrasadas: 0, proximas: 0 });


  // 2. FUNCIONES DE LÓGICA
  const manejarDias = (dia) => {
    setFormularioTarea((estadoPrevio) => {

      let rawDias = estadoPrevio.dias_especificos;
      let diasArray = [];

      if (Array.isArray(rawDias)) {
        diasArray = [...rawDias];
      } else if (typeof rawDias === 'string') {
        try {
          let parseado = JSON.parse(rawDias);
          diasArray = Array.isArray(parseado) ? parseado : [parseado];
        } catch (error) {
          diasArray = rawDias.trim() !== '' ? [rawDias.trim()] : [];
        }
      }
      let nuevosDias;
      if (diasArray.includes(dia)) {
        nuevosDias = diasArray.filter(d => d !== dia);
      } else {
        nuevosDias = [...diasArray, dia];
      }
      return {
        ...estadoPrevio,
        dias_especificos: nuevosDias
      };
    });
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
        setFormularioTarea({ id: null, titulo: '', categoria: 'Limpieza / General', frecuencia: 'Dias Especificos', hora_programada: '00:00', dias_especificos: [], fecha_unica: '', descripcion: '' });
        try {
          const resTareas = await fetch(`${URL_API}/tareas`);
          const tareasActualizadas = await resTareas.json();
          setTareas(tareasActualizadas);
        } catch (err) {
          console.error("Error al refrescar la tabla de rutinas:", err);
        }
      } else {
        toast.error("Error al guardar la tarea.");
      }
    } catch (error) {
      console.error("Error de red al guardar la tarea:", error);
      toast.error("Ocurrió un error de conexión.");
    } finally {
      ocultarCarga();
    }
  };

  const marcarTareaCompletada = async (id, formData) => {
    try {
      // Agregamos el usuario al FormData si no viene
      if (!formData.has('usuario')) {
        formData.append('usuario', usuario);
      }

      const tarea = tareas.find(t => t.id === id);
      if (tarea && tarea.proxima_ejecucion) {
        // Parseamos las fechas reemplazando espacios para evitar bugs de zona horaria
        const fechaLimite = new Date(tarea.proxima_ejecucion.replace(' ', 'T'));
        fechaLimite.setHours(0, 0, 0, 0); // Solo consideramos el día
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0);

        // Si el día actual superó el día límite de la tarea...
        if (ahora.getTime() > fechaLimite.getTime()) {
          const comentarioPrevio = formData.get('comentario') || '';
          const etiquetaTarde = "⚠️ Realizado pero tarde";
          // Concatenamos la etiqueta al comentario (o la ponemos sola si no escribió nada)
          formData.set('comentario', comentarioPrevio ? `${comentarioPrevio} | ${etiquetaTarde}` : etiquetaTarde);
        }
      }

      const respuesta = await fetch(`${URL_API}/tareas/${id}/completar`, {
        method: 'PUT',
        body: formData
      });

      if (!respuesta.ok) throw new Error("El servidor falló al completar la tarea");

      const tareaActualizada = await respuesta.json();

      if (tareaActualizada.eliminada) {
        setTareas(prev => prev.filter(t => t.id !== id));
        toast.success("¡Excelente! Tarea de Fecha Única completada y archivada.");
        return;
      }

      setTareas(prev => {
        const nuevasTareas = prev.map(t => t.id === id ? tareaActualizada : t);
        return nuevasTareas.sort((a, b) => new Date(a.proxima_ejecucion) - new Date(b.proxima_ejecucion));
      });
      toast.success("¡Excelente! Tarea completada. Quedó reprogramada.");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar la rutina.");
    }
  };

  const iniciarTarea = async (id) => {
    try {
      // 1. Guardamos la respuesta del backend en una variable
      const respuesta = await fetch(`${URL_API}/tareas/${id}/iniciar`, { method: 'PUT' });

      // 2. Le preguntamos a fetch si el status HTTP fue exitoso (ej: 200)
      if (!respuesta.ok) {
        // Si el backend falló, forzamos a que salte al 'catch' de abajo
        throw new Error("El servidor no pudo actualizar la tarea");
      }

      // 3. Si llegó hasta acá, es porque en la base de datos SÍ se guardó
      toast.success("▶ Cronómetro iniciado. ¡A trabajar!");

      // 4. Refrescamos la tabla
      try {
        const resTareas = await fetch(`${URL_API}/tareas`);
        const tareasActualizadas = await resTareas.json();
        setTareas(tareasActualizadas);
      } catch (err) {
        console.error("Error al refrescar la tabla de rutinas:", err);
      }

    } catch (error) {
      // Ahora sí, si falla la DB, va a caer acá y mostrar el cartel rojo
      console.error("Error en iniciarTarea:", error);
      toast.error("Error al iniciar la tarea. Revisá la consola del Backend.");
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
      try {
        const resTareas = await fetch(`${URL_API}/tareas`);
        const tareasActualizadas = await resTareas.json();
        setTareas(tareasActualizadas);
      } catch (err) {
        console.error("Error al refrescar la tabla de rutinas:", err);
      }
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

  const exportarHistorialTareas = async (fechaInicio, fechaFin) => {
    const exportarTodo = !fechaInicio || !fechaFin;
    const toastId = toast.loading(exportarTodo ? "Recopilando todas las rutinas..." : "Filtrando tareas por fecha...");

    const obtenerFrecuenciaDetallada = (tareaObj) => {
      if (!tareaObj) return "Desconocida";
      if (tareaObj.frecuencia === 'Dias Especificos') {
        let dias = [];
        try {
          dias = typeof tareaObj.dias_especificos === 'string'
            ? JSON.parse(tareaObj.dias_especificos)
            : (tareaObj.dias_especificos || []);

          if (typeof dias === 'string') {
            dias = JSON.parse(dias);
          }

          if (!Array.isArray(dias)) {
            dias = [];
          }
        } catch (e) {
          dias = [];
        }

        const mapaDias = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábados', 0: 'Domingos' };
        // Como ahora garantizamos que 'dias' es un Array, el .map() jamás va a fallar
        const nombresDias = dias.map(d => mapaDias[d] || '').filter(Boolean).join(', ');
        return `Todos los ${nombresDias}`;
      }
      if (tareaObj.frecuencia === 'Fecha Unica') {
        if (!tareaObj.fecha_unica) return "Fecha Única";
        const f = new Date(tareaObj.fecha_unica + 'T00:00:00');
        return `Única fecha: el ${f.toLocaleDateString('es-AR')}`;
      }
      if (tareaObj.frecuencia === 'Mensual') return 'Cada 1° de cada mes';
      return tareaObj.frecuencia || 'Sin frecuencia';
    };

    try {
      let desde, hasta;
      if (!exportarTodo) {
        desde = new Date(fechaInicio);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(fechaFin);
        hasta.setHours(23, 59, 59, 999);
      }

      const respuesta = await fetch(`${URL_API}/tareas/historial`);
      const datosHistorial = await respuesta.json();

      // ==========================================
      // 1. HISTORIAL (Finalizadas u Omitidas)
      // ==========================================
      // Ordenamos el historial por tarea y fecha para poder calcular el rango (inicio y fin) de cada ciclo
      const historialOrdenado = [...datosHistorial].sort((a, b) => new Date(a.fecha_completada) - new Date(b.fecha_completada));

      // Mapa para rastrear la fecha anterior por cada tarea_id
      const ultimaFechaPorTarea = {};

      // ==========================================
      // 1. HISTORIAL (Finalizadas u Omitidas)
      // ==========================================
      const finalizadasExcel = historialOrdenado
        .filter(registro => {
          if (exportarTodo) return true;
          const fechaSegura = registro.fecha_completada ? registro.fecha_completada.replace(' ', 'T') : null;
          if (!fechaSegura) return false;
          const fCompletada = new Date(fechaSegura);
          return fCompletada >= desde && fCompletada <= hasta;
        })
        .map(registro => {
          const tareaOriginal = tareas.find(t => t.id === registro.tarea_id);
          const frecuenciaDetallada = tareaOriginal ? obtenerFrecuenciaDetallada(tareaOriginal) : "Histórico";

          const fueOmitida = registro.usuario_que_completo && registro.usuario_que_completo.includes("Sistema (No realizada");

          let estadoExportacion = "✅ Realizada";
          if (fueOmitida) {
            estadoExportacion = "❌ No realizado";
          }

          let comentarioLimpio = registro.comentario || 'Sin comentario';
          comentarioLimpio = comentarioLimpio.replace(" | ⚠️ Realizado pero tarde", "").replace("⚠️ Realizado pero tarde", "").trim();
          if (comentarioLimpio === "") comentarioLimpio = "Sin comentario";

          // 1. FECHA REALIZADO (Cuándo ocurrió el evento en la BD)
          const fechaValida = registro.fecha_completada ? new Date(registro.fecha_completada) : null;
          const fechaRealizadoStr = fechaValida ? fechaValida.toLocaleDateString('es-AR') : 'Sin fecha';
          const horaRealizadoStr = fechaValida ? fechaValida.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'Sin hora';

          // 2. FECHA INICIO y FECHA CIERRE DEL CICLO
          // Tomamos como referencia base la fecha en que se completó/venció este registro
          const fechaBase = fechaValida || new Date();
          let fechaInicioCiclo = new Date(fechaBase);
          let fechaCierreCiclo = new Date(fechaBase);

          if (tareaOriginal) {
            if (tareaOriginal.frecuencia === 'Dias Especificos' || tareaOriginal.frecuencia === 'Semanal') {
              // Si es semanal o días específicos, el ciclo dura 7 días desde el inicio hasta la víspera del siguiente
              fechaInicioCiclo.setDate(fechaBase.getDate() - 7);
              fechaCierreCiclo.setHours(23, 59, 59, 999);
            } else if (tareaOriginal.frecuencia === 'Quincenal') {
              fechaInicioCiclo.setDate(fechaBase.getDate() - 15);
              fechaCierreCiclo.setHours(23, 59, 59, 999);
            } else if (tareaOriginal.frecuencia === 'Mensual') {
              fechaInicioCiclo.setMonth(fechaBase.getMonth() - 1);
              fechaCierreCiclo.setHours(23, 59, 59, 999);
            } else {
              // Fallback general por defecto
              fechaInicioCiclo.setDate(fechaBase.getDate() - 1);
              fechaCierreCiclo.setHours(23, 59, 59, 999);
            }
          } else {
            fechaInicioCiclo.setDate(fechaBase.getDate() - 7);
            fechaCierreCiclo.setHours(23, 59, 59, 999);
          }

          let personalAsignado = tareaOriginal?.usuario_asignado || registro.usuario_que_completo;
          if (fueOmitida) {
            personalAsignado = tareaOriginal?.usuario_asignado || "Sin asignar";
          }

          return {
            "ID Tarea": registro.tarea_id,
            "Rutina a Realizar": registro.titulo_tarea,
            "Estado": estadoExportacion,
            "Frecuencia": frecuenciaDetallada,
            "Completado Por": registro.usuario_que_completo || 'Sin registro',
            "Fecha Inicio": fechaInicioCiclo.toLocaleDateString('es-AR'),
            "Fecha Cierre": `${fechaCierreCiclo.toLocaleDateString('es-AR')} 23:59:59`,
            "Fecha realizado": fechaRealizadoStr,
            "Hora Realizado": horaRealizadoStr,
            "Tiempo Dedicado": registro.tiempo_total_minutos ? `${Math.round(registro.tiempo_total_minutos)} min` : '0 min',
            "Comentario": comentarioLimpio,
            "Evidencia (Archivo)": registro.archivo_adjunto ? `${URL_API.startsWith('http') ? URL_API : window.location.origin + URL_API}/tareas/archivo/${registro.archivo_adjunto}` : 'Sin archivo'
          }
        });
      // ==========================================
      // 2. ACTIVAS PENDIENTES (Aún en el tablero)
      // ==========================================
      const activasExcel = tareas
        .filter(tarea => {
          if (exportarTodo) return true;
          if (!tarea.proxima_ejecucion) return false;
          const fechaSegura = tarea.proxima_ejecucion.replace(' ', 'T');
          const fProxima = new Date(fechaSegura);
          return fProxima >= desde && fProxima <= hasta;
        })
        .map(tarea => {
          const fechaProx = new Date(tarea.proxima_ejecucion.replace(' ', 'T'));

          let aclaracionFrecuencia = tarea.frecuencia;
          if (tarea.frecuencia === 'Semestral') aclaracionFrescuencia = 'Semestral (cada 6 meses)';
          else if (tarea.frecuencia === 'Bimestral') aclaracionFrecuencia = 'Bimestral (cada 2 meses)';
          else if (tarea.frecuencia === 'Trimestral') aclaracionFrecuencia = 'Trimestral (cada 3 meses)';
          else if (tarea.frecuencia === 'Mensual') aclaracionFrecuencia = 'Mensual (cada 1 mes)';
          else if (tarea.frecuencia === 'Fecha Unica') aclaracionFrecuencia = 'Fecha Única (única vez)';

          const fechaInicioPendiente = tarea.ultima_vez_completada ? new Date(tarea.ultima_vez_completada).toLocaleDateString('es-AR') : 'Inicio ciclo';

          return {
            "ID Tarea": tarea.id,
            "Rutina a Realizar": tarea.titulo,
            "Estado": "⏳ Pendiente",
            "Frecuencia": aclaracionFrecuencia,
            "Completado Por": "Sin asignar",
            "Fecha de inicio": fechaInicioPendiente,
            "Fecha Fin de tarea": fechaProx.toLocaleDateString('es-AR'),
            "Fecha realizado": "Pendiente",
            "Hora Realizado": "N/A",
            "Tiempo Dedicado": "0 min",
            "Comentario": "Pendiente de realización",
            "Evidencia (Archivo)": "Sin archivo"
          };
        });

      const datosCompletos = [...finalizadasExcel, ...activasExcel];

      if (datosCompletos.length === 0) {
        toast.error("No se encontraron registros en el rango de fechas seleccionado.", { id: toastId });
        return;
      }

      const libro = XLSX.utils.book_new();

      // 1. AGRUPAMOS LOS DATOS POR EL TÍTULO DE LA TAREA
      const tareasAgrupadas = {};
      datosCompletos.forEach(fila => {
        const titulo = fila["Rutina a Realizar"] || "Sin Título";
        if (!tareasAgrupadas[titulo]) {
          tareasAgrupadas[titulo] = [];
        }
        tareasAgrupadas[titulo].push(fila);
      });

      // 2. FUNCIÓN PARA LIMPIAR NOMBRES DE HOJAS
      // Excel tiene un límite estricto de 31 caracteres para el nombre de las hojas y prohíbe ciertos símbolos
      const sanitizeSheetName = (name) => {
        return name.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 31);
      };

      const sheetNamesUsed = new Set();

      // 3. CREAMOS UNA HOJA (SHEET) POR CADA GRUPO
      Object.keys(tareasAgrupadas).forEach(titulo => {
        const hoja = XLSX.utils.json_to_sheet(tareasAgrupadas[titulo]);

        let baseName = sanitizeSheetName(titulo);
        let finalName = baseName;
        let counter = 1;

        // Si dos tareas largas se truncan igual, le sumamos un número para que Excel no crashee
        while (sheetNamesUsed.has(finalName)) {
          const suffix = `_${counter}`;
          finalName = baseName.substring(0, 31 - suffix.length) + suffix;
          counter++;
        }
        sheetNamesUsed.add(finalName);

        XLSX.utils.book_append_sheet(libro, hoja, finalName);
      });

      let nombreArchivo = "Reporte_Historial_Completo.xlsx";
      if (!exportarTodo) {
        const fStr = desde.toLocaleDateString('es-AR').replace(/\//g, '-');
        nombreArchivo = `Reporte_Rutinas_Desde_${fStr}.xlsx`;
      }

      XLSX.writeFile(libro, nombreArchivo);
      toast.success("¡Reporte completo descargado!", { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error("Error al generar el Excel de tareas.", { id: toastId });
    }
  };
  const calcularTiempoTarea = (tarea) => {
    if (!tarea || !tarea.proxima_ejecucion) return "";
    const fecha = new Date(tarea.proxima_ejecucion.replace(' ', 'T'));
    fecha.setHours(0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const difMs = fecha - hoy;
    if (difMs < 0) return "⚠️ Atrasada";

    const dias = Math.round(difMs / (1000 * 60 * 60 * 24));

    if (dias === 0) return `🗓️ Hoy`;
    if (dias === 1) return `🗓️ Mañana`;
    return `🗓️ Faltan ${dias} días`;
  };

  // 1. Ponemos el helper acá adentro
  const obtenerTiempo = (fechaStr) => {
    if (!fechaStr) return Infinity;
    if (fechaStr.includes('-')) return new Date(fechaStr).getTime();

    const parts = fechaStr.split(/[\/\s:]/);
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const hh = parts[3] ? parseInt(parts[3], 10) : 0;
      const mm = parts[4] ? parseInt(parts[4], 10) : 0;
      return new Date(y, m, d, hh, mm).getTime();
    }
    const ms = new Date(fechaStr).getTime();
    return isNaN(ms) ? Infinity : ms;
  };

  // 2. Actualizamos tu función para que use el helper
  const fueCompletadaHoy = (fechaString) => {
    if (!fechaString) return false;

    const tiempo = obtenerTiempo(fechaString);
    if (tiempo === Infinity) return false;

    const fechaCompletada = new Date(tiempo);
    const hoy = new Date();

    return fechaCompletada.getDate() === hoy.getDate() &&
      fechaCompletada.getMonth() === hoy.getMonth() &&
      fechaCompletada.getFullYear() === hoy.getFullYear();
  };

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

  const cargarIndicadores = async () => {
    if (!usuario) return;
    try {
      const res = await fetch(`${URL_API}/tareas/indicadores/${encodeURIComponent(usuario)}`);
      if (res.ok) {
        const data = await res.json();
        setIndicadores(data);
      }
    } catch (error) {
      console.error("Error cargando indicadores", error);
    }
  };

  const marcarComoVista = async (tareaId) => {
    if (!indicadores?.idsNuevas?.includes(tareaId)) return;
    try {
      await fetch(`${URL_API}/tareas/${tareaId}/marcar-vista`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreUsuario: usuario })
      });
      setIndicadores(prev => ({
        ...prev,
        cantidadNuevas: prev.cantidadNuevas - 1,
        idsNuevas: prev.idsNuevas.filter(id => id !== tareaId)
      }));
    } catch (error) {
      console.error("Error marcando vista", error);
    }
  };

  const abrirModalEditarTarea = (tarea) => {
    let diasLimpios = [];

    // 1. Verificamos cómo viene la información de la base de datos (Días)
    if (Array.isArray(tarea.dias_especificos)) {
      diasLimpios = tarea.dias_especificos;
    } else if (typeof tarea.dias_especificos === 'string') {
      try {
        diasLimpios = JSON.parse(tarea.dias_especificos);
      } catch (e) {
        diasLimpios = tarea.dias_especificos.split(',').map(d => d.trim());
      }
    }

    // 2. Limpieza de Fecha Única
    let fechaUnicaLimpia = '';
    if (tarea.fecha_unica) {
      fechaUnicaLimpia = String(tarea.fecha_unica).substring(0, 10);
    }

    setFormularioTarea({
      ...tarea,
      fecha_unica: fechaUnicaLimpia,
      dias_especificos: diasLimpios,
      hora_programada: '00:00' // Siempre en '00:00'
    });

    setMostrarModalTarea(true);
  };

  const asignarTarea = async (idTarea, nombreTecnico) => {
    try {
      const res = await fetch(`${URL_API}/tareas/${idTarea}/asignar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_asignado: nombreTecnico })
      });
      if (res.ok) {
        toast.success(`Tarea asignada a ${nombreTecnico}`);
      }
    } catch (error) {
      toast.error("Error al asignar técnico");
    }
  };

  // 3. EXPORTAMOS LO QUE MAIN.JSX NECESITA
  return {
    tareas, setTareas,
    mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea,
    manejarDias, guardarTarea, marcarTareaCompletada,
    iniciarTarea, pausarTarea, eliminarTarea,
    exportarHistorialTareas, calcularTiempoTarea, fueCompletadaHoy, esTareaFutura, formatearFrecuenciaTexto, abrirModalEditarTarea, indicadores,
    cargarIndicadores,
    marcarComoVista,
    asignarTarea
  };
};