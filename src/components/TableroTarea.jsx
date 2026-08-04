import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { createPortal } from 'react-dom';

const Tarjeta = ({ 
    tarea, 
    index, 
    estaBloqueada, 
    indicadores, 
    marcarComoVista, 
    esAdmin, 
    abrirModalEditarTarea, 
    asignarTarea,
    tecnicosFiltrados,
    formatearFrecuenciaTexto,
    idCol, 
    setTareaSeleccionadaFinalizar,
    setMostrarModalFinalizar,
    abrirHistorialTarea 
}) => {
    return (
        <Draggable draggableId={tarea.id.toString()} index={index} isDragDisabled={estaBloqueada}>
            {(provided, snapshot) => {
                const estiloGris = estaBloqueada ? { opacity: 0.6, filter: 'grayscale(10%)' } : {};
                const child = (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => !estaBloqueada && marcarComoVista(tarea.id)} 
                        className={`card mb-3 ${snapshot.isDragging ? 'shadow-lg bg-light border-0' : (estaBloqueada ? 'shadow-none bg-secondary bg-opacity-10 border border-secondary border-opacity-25' : 'bg-white border-0 shadow-sm')}`}
                        style={{ 
                            ...provided.draggableProps.style, 
                            borderRadius: '12px',
                            cursor: estaBloqueada ? 'not-allowed' : 'grab'
                        }}
                    >
                        {indicadores?.idsNuevas?.includes(tarea.id) && !estaBloqueada && (
                            <span 
                                className="position-absolute top-0 start-0 translate-middle p-1 bg-danger border border-white rounded-circle" 
                                style={{ width: '14px', height: '14px', zIndex: 10, marginLeft: '8px', marginTop: '8px' }}
                            ></span>
                        )}

                        <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                 <span className="badge bg-secondary bg-opacity-10 text-secondary border-0 d-inline-block text-truncate" style={{fontSize: '0.65rem', padding: '4px 8px', maxWidth: '110px', verticalAlign: 'middle', ...estiloGris}} title={tarea.categoria}>{tarea.categoria}</span>
                                
                                <div className="d-flex align-items-center gap-1">
                                    {esAdmin ? (
                                        <select 
                                            className="form-select form-select-sm border-0 bg-light text-muted" 
                                            style={{ width: 'auto', fontSize: '0.7rem', borderRadius: '15px', padding: '2px 25px 2px 10px' }}
                                            value={tarea.usuario_asignado || ''}
                                            onChange={(e) => asignarTarea(tarea.id, e.target.value)}
                                        >
                                            <option value="">👤 Sin asignar</option>
                                            {tarea.usuario_asignado && !tecnicosFiltrados.find(u => u.nombre === tarea.usuario_asignado) && (
                                                <option value={tarea.usuario_asignado}>👤 {tarea.usuario_asignado}</option>
                                            )}
                                            {tecnicosFiltrados.map(u => (
                                                <option key={u.id} value={u.nombre}>🧑🏻‍🔧 {u.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`badge ${tarea.usuario_asignado ? 'bg-info bg-opacity-10 text-info' : 'bg-light text-muted'} rounded-pill fw-normal`} style={{fontSize: '0.7rem', padding: '3px 10px'}}>
                                            {tarea.usuario_asignado ? `👤 ${tarea.usuario_asignado.split(' ')[0]}` : '👤 Disponible'}
                                        </span>
                                    )}

                                    <button 
                                        className="btn btn-link btn-sm p-1 opacity-100"
                                        onClick={(e) => { e.stopPropagation(); abrirHistorialTarea(tarea); }}
                                        style={{ textDecoration: 'none' }}
                                        title="Ver Historial"
                                    >
                                        🕒
                                    </button>

                                    <button 
                                        className="btn btn-link btn-sm p-1 opacity-100"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (idCol === 'col-finalizadas') {
                                                setTareaSeleccionadaFinalizar(tarea);
                                                setMostrarModalFinalizar(true);
                                            } else if (esAdmin) {
                                                abrirModalEditarTarea(tarea); 
                                            }
                                        }}
                                        style={{ 
                                            textDecoration: 'none',
                                            display: (esAdmin || idCol === 'col-finalizadas') ? 'block' : 'none'
                                        }}
                                        title="Editar Tarea"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            </div>

                            <h6 className="card-title fw-bold text-dark mb-2" style={{fontSize: '0.95rem', lineHeight: '1.3', ...estiloGris}}>{tarea.titulo}</h6>
                            
                            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light" style={estiloGris}>
                                <div className="text-muted" style={{fontSize: '0.75rem'}}>
                                    {formatearFrecuenciaTexto(tarea)}
                                </div>
                                
                               {estaBloqueada && (
                                    <div className={`badge fw-normal ${idCol === 'col-finalizadas' ? 'bg-light text-success border border-success border-opacity-25' : 'bg-light text-muted'}`} style={{fontSize: '0.7rem'}}>
                                        {idCol === 'col-finalizadas' 
                                            ? '🔒 Completada' 
                                            : `🔒 ${new Date(tarea.proxima_ejecucion).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'})}`
                                        }
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                );

                if (snapshot.isDragging) {
                    return createPortal(child, document.body);
                }
                return child;
            }}
        </Draggable>
    );
};

const Columna = ({ 
    id, 
    titulo, 
    listaTareas, 
    colorBg, 
    icono, 
    indicadores, 
    marcarComoVista, 
    esAdmin, 
    abrirModalEditarTarea, 
    asignarTarea,
    tecnicosFiltrados,
    formatearFrecuenciaTexto,
    setTareaSeleccionadaFinalizar,
    setMostrarModalFinalizar,
    abrirHistorialTarea
}) => (
    <div className={`rounded-3 p-3 ${colorBg}`} style={{ flex: 1, minWidth: '280px', minHeight: '500px' }}>
        <h6 className="fw-bold text-dark d-flex justify-content-between align-items-center mb-3">
            <span>{icono} {titulo}</span>
            <span className="badge bg-dark rounded-pill">{listaTareas.length}</span>
        </h6>

       <Droppable droppableId={id}>
            {(provided) => (
                <div 
                    ref={provided.innerRef} {...provided.droppableProps}
                    className="h-100"
                    style={{ minHeight: '150px' }}
                >
                    {listaTareas.map((tarea, index) => {
                        
                        const fechaProx = tarea.proxima_ejecucion ? new Date(tarea.proxima_ejecucion.replace(' ', 'T')) : null;
                        const hoy = new Date();
                        hoy.setHours(0, 0, 0, 0);
                        if (fechaProx) fechaProx.setHours(0,0,0,0);

                        const estaBloqueada = id === 'col-finalizadas' || (id === 'col-pendientes' && fechaProx && fechaProx > hoy);

                        return (
                            <Tarjeta 
                                key={tarea.id} 
                                tarea={tarea} 
                                index={index} 
                                estaBloqueada={estaBloqueada}
                                indicadores={indicadores}
                                marcarComoVista={marcarComoVista}
                                esAdmin={esAdmin}
                                abrirModalEditarTarea={abrirModalEditarTarea}
                                asignarTarea={asignarTarea}
                                tecnicosFiltrados={tecnicosFiltrados}
                                formatearFrecuenciaTexto={formatearFrecuenciaTexto}
                                idCol={id}
                                setTareaSeleccionadaFinalizar={setTareaSeleccionadaFinalizar}
                                setMostrarModalFinalizar={setMostrarModalFinalizar}
                                abrirHistorialTarea={abrirHistorialTarea} 
                            />
                        );
                    })}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </div>
);

// COMPONENTE PRINCIPAL
export default function TableroTareas({ 
    tareas, 
    iniciarTarea, 
    pausarTarea, 
    setTareaSeleccionadaFinalizar, 
    setMostrarModalFinalizar, 
    formatearFrecuenciaTexto,
    indicadores,
    marcarComoVista,
    asignarTarea,
    esAdmin,
    abrirModalEditarTarea,
    usuarioLogueado,
    usuariosLista,
    abrirHistorialTarea 
}) {

    const { pendientes, enCurso, pausadas, finalizadas } = useMemo(() => {
        const listas = { pendientes: [], enCurso: [], pausadas: [], finalizadas: [] };
        const ahora = new Date();
        const hoyStr = ahora.toISOString().split('T')[0]; 

        tareas.forEach(tarea => {
            const estaPausada = tarea.en_pausa == 1 || tarea.en_pausa === true;
            
            const estaCompletadaDefinitiva = tarea.estado === 'Completada Definitiva' || tarea.estado === 'Finalizada';
            
            const fechaUltimaCompletadaStr = tarea.ultima_vez_completada ? new Date(tarea.ultima_vez_completada).toISOString().split('T')[0] : null;
            const seCompletoHoy = fechaUltimaCompletadaStr === hoyStr;

            if (estaPausada) {
                listas.pausadas.push(tarea);
            }
            else if (tarea.estado === 'En Curso') {
                listas.enCurso.push(tarea);
            } 
            else if (seCompletoHoy || estaCompletadaDefinitiva) {
                listas.finalizadas.push(tarea);
            } 
            else {
                listas.pendientes.push(tarea);
            }
        });
        return listas;
    }, [tareas]);

    const tecnicosFiltrados = useMemo(() => {
        const nombresAutorizados = ['pedro', 'federico', 'Gustavo Chapur'];
        return usuariosLista?.filter(u => 
            nombresAutorizados.some(nom => u.nombre.toLowerCase().includes(nom.toLowerCase()))
        ) || [];
    }, [usuariosLista]);

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

        const idTarea = parseInt(draggableId);
        const tareaMovida = tareas.find(t => t.id === idTarea);

        if (destination.droppableId === 'col-encurso') {
            iniciarTarea(idTarea);
            if (usuarioLogueado) {
                asignarTarea(idTarea, usuarioLogueado);
            }
        }
        else if (destination.droppableId === 'col-pausa') {
            pausarTarea(idTarea);
        }
        else if (destination.droppableId === 'col-finalizadas') {
            setTareaSeleccionadaFinalizar(tareaMovida);
            setMostrarModalFinalizar(true);
        }
        else if (destination.droppableId === 'col-pendientes') {
            pausarTarea(idTarea);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="d-flex gap-3 p-2 overflow-auto" style={{ alignItems: 'flex-start' }}>
                <Columna 
                    id="col-pendientes" titulo="Pendientes" listaTareas={pendientes} colorBg="bg-light" icono="⏳" 
                    indicadores={indicadores} marcarComoVista={marcarComoVista} esAdmin={esAdmin} 
                    abrirModalEditarTarea={abrirModalEditarTarea} asignarTarea={asignarTarea}
                    tecnicosFiltrados={tecnicosFiltrados} formatearFrecuenciaTexto={formatearFrecuenciaTexto}
                    setTareaSeleccionadaFinalizar={setTareaSeleccionadaFinalizar}
                    setMostrarModalFinalizar={setMostrarModalFinalizar}
                    abrirHistorialTarea={abrirHistorialTarea} 
                />
                <Columna 
                    id="col-encurso" titulo="En Curso" listaTareas={enCurso} colorBg="bg-primary bg-opacity-10" icono="▶️" 
                    indicadores={indicadores} marcarComoVista={marcarComoVista} esAdmin={esAdmin} 
                    abrirModalEditarTarea={abrirModalEditarTarea} asignarTarea={asignarTarea}
                    tecnicosFiltrados={tecnicosFiltrados} formatearFrecuenciaTexto={formatearFrecuenciaTexto}
                    setTareaSeleccionadaFinalizar={setTareaSeleccionadaFinalizar}
                    setMostrarModalFinalizar={setMostrarModalFinalizar}
                    abrirHistorialTarea={abrirHistorialTarea} 
                />
                <Columna 
                    id="col-pausa" titulo="Pausa" listaTareas={pausadas} colorBg="bg-warning bg-opacity-10" icono="⏸️" 
                    indicadores={indicadores} marcarComoVista={marcarComoVista} esAdmin={esAdmin} 
                    abrirModalEditarTarea={abrirModalEditarTarea} asignarTarea={asignarTarea}
                    tecnicosFiltrados={tecnicosFiltrados} formatearFrecuenciaTexto={formatearFrecuenciaTexto}
                    setTareaSeleccionadaFinalizar={setTareaSeleccionadaFinalizar}
                    setMostrarModalFinalizar={setMostrarModalFinalizar}
                    abrirHistorialTarea={abrirHistorialTarea} 
                />
                <Columna 
                    id="col-finalizadas" titulo="Finalizadas (Hoy)" listaTareas={finalizadas} colorBg="bg-success bg-opacity-10" icono="✅" 
                    indicadores={indicadores} marcarComoVista={marcarComoVista} esAdmin={esAdmin} 
                    abrirModalEditarTarea={abrirModalEditarTarea} asignarTarea={asignarTarea}
                    tecnicosFiltrados={tecnicosFiltrados} formatearFrecuenciaTexto={formatearFrecuenciaTexto}
                    setTareaSeleccionadaFinalizar={setTareaSeleccionadaFinalizar}
                    setMostrarModalFinalizar={setMostrarModalFinalizar}
                    abrirHistorialTarea={abrirHistorialTarea} 
                />
            </div>
        </DragDropContext>
    );
}