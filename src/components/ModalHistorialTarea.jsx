import React, { useState, useEffect } from 'react';
       
const ModalHistorialTarea = ({ mostrar, setMostrar, tareaId, URL_API }) => {
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [ejecucionSeleccionada, setEjecucionSeleccionada] = useState(null);

    useEffect(() => {
        if (mostrar && tareaId) {
            fetchHistorial();
        }
    }, [mostrar, tareaId]);

    const fetchHistorial = async () => {
        try {
            setCargando(true);
            const res = await fetch(`${URL_API}/tareas/historial/${tareaId}`);
            if (res.ok) {
                const data = await res.json();
                setHistorial(data);
            }
        } catch (error) {
            console.error("Error fetching historial:", error);
        } finally {
            setCargando(false);
        }
    };

    const historialFiltrado = historial.filter(h => 
        h.usuario_que_completo?.toLowerCase().includes(filtro.toLowerCase()) ||
        h.comentario?.toLowerCase().includes(filtro.toLowerCase())
    );

    if (!mostrar) return null;

    return (
        <>
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                    <div className="modal-header bg-dark text-white border-0 py-3" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                        <h5 className="modal-title d-flex align-items-center gap-2">
                             <span style={{ fontSize: '1.2rem' }}>🕒</span> Historial de Ejecuciones Pasadas
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setMostrar(false)}></button>
                    </div>
                    
                    <div className="modal-body p-4 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
                            <div className="input-group" style={{ maxWidth: '400px' }}>
                                <span className="input-group-text bg-white border-end-0"><span style={{fontSize: '0.9rem'}}>🔍</span></span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0" 
                                    placeholder="Buscar por usuario o comentario..." 
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-outline-primary btn-sm" onClick={fetchHistorial}>
                                🔄 Actualizar
                            </button>
                        </div>

                        {cargando ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Cargando antecedentes...</p>
                            </div>
                        ) : historialFiltrado.length > 0 ? (
                            <div className="table-responsive rounded-3 shadow-sm bg-white">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr className="small text-muted text-uppercase ls-1">
                                            <th className="py-3 px-4">Fecha Finalización</th>
                                            <th className="py-3">Responsable</th>
                                            <th className="py-3">Tiempo</th>
                                            <th className="py-3">Instrucciones & Reporte</th>
                                            <th className="py-3 text-center">Evidencias</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialFiltrado.map((h) => (
                                            <tr key={h.id} 
                                                onClick={() => setEjecucionSeleccionada(h)}
                                                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                className="hover-shadow-sm"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>
                                                        {new Date(h.fecha_completada).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {new Date(h.fecha_completada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill fw-bold" style={{fontSize: '0.8rem'}}>
                                                        👤 {h.usuario_que_completo}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="text-secondary fw-bold" style={{fontSize: '0.9rem'}}>
                                                            {Math.round(h.tiempo_total_minutos)}
                                                        </span>
                                                        <span className="text-muted" style={{fontSize: '0.75rem'}}>min</span>
                                                    </div>
                                                </td>
                                                <td style={{ maxWidth: '350px' }}>
                                                    {h.instrucciones_tarea && (
                                                        <div className="mb-2 p-2 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded shadow-sm" style={{ fontSize: '0.75rem' }}>
                                                            <div className="fw-bold text-dark mb-1 ls-1 text-uppercase" style={{ fontSize: '0.65rem' }}>📝 Instrucciones Solicitadas:</div>
                                                            <div className="font-monospace text-dark" dangerouslySetInnerHTML={{ __html: h.instrucciones_tarea }} style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}></div>
                                                        </div>
                                                    )}
                                                    <div className="fw-bold text-primary mb-1 ls-1 text-uppercase mt-2" style={{ fontSize: '0.65rem' }}>✅ Reporte de Ejecución:</div>
                                                    <p className="mb-0 text-dark small overflow-hidden" title={h.comentario} style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                        {h.comentario || <span className="fst-italic text-muted">Sin comentarios</span>}
                                                    </p>
                                                </td>
                                                <td className="text-center">
                                                    {h.archivo_adjunto ? (() => {
                                                        let archivos = [];
                                                        try {
                                                            archivos = JSON.parse(h.archivo_adjunto);
                                                        } catch (e) {
                                                            if (h.archivo_adjunto) archivos = [h.archivo_adjunto];
                                                        }
                                                        
                                                        const obtenerInfo = (file) => {
                                                            const ext = file.split('.').pop().toLowerCase();
                                                            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { ico: '🖼️', txt: 'IMG', col: 'btn-outline-primary' };
                                                            if (ext === 'pdf') return { ico: '📕', txt: 'PDF', col: 'btn-outline-danger' };
                                                            if (['doc', 'docx'].includes(ext)) return { ico: '📘', txt: 'WORD', col: 'btn-outline-info' };
                                                            if (['xls', 'xlsx', 'csv'].includes(ext)) return { ico: '📗', txt: 'EXCEL', col: 'btn-outline-success' };
                                                            if (['zip', 'rar'].includes(ext)) return { ico: '📦', txt: 'ZIP', col: 'btn-outline-dark' };
                                                            return { ico: '📄', txt: 'DOC', col: 'btn-outline-secondary' };
                                                        };

                                                        return (
                                                            <div className="d-flex justify-content-center gap-2 flex-wrap">
                                                                {archivos.map((file, idx) => {
                                                                    const info = obtenerInfo(file);
                                                                    const url = `${URL_API}/tareas/archivo/${file}`;
                                                                    
                                                                    return (
                                                                        <button 
                                                                            key={idx}
                                                                            type="button"
                                                                            className={`btn btn-sm ${info.col} p-1 px-2 d-flex align-items-center gap-1`}
                                                                            onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}
                                                                            title={file}
                                                                            style={{ minWidth: '65px', fontSize: '0.65rem' }}
                                                                        >
                                                                            <span>{info.ico}</span>
                                                                            <span className="fw-bold">{info.txt}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })() : (
                                                        <span className="text-muted" style={{fontSize: '0.75rem'}}>Sin adjuntos</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 bg-white rounded-3 border">
                                <div style={{ fontSize: '3rem' }}>📁</div>
                                <h6 className="mt-3 text-secondary fw-bold">No hay registros previos</h6>
                                <p className="text-muted small">Esta rutina aún no se ha completado en el pasado.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer border-0 py-3 bg-light" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                        <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={() => setMostrar(false)}>Cerrar Historial</button>
                    </div>
                </div>
            </div>
        </div>

        {/* SUBMODAL CON EL DETALLE DE LA EJECUCIÓN */}
        {ejecucionSeleccionada && (
             <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}>
                 <div className="modal-dialog modal-dialog-centered modal-lg">
                     <div className="modal-content shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                         <div className="modal-header bg-success text-white py-3 border-0 shadow-sm">
                             <h5 className="modal-title fw-bold d-flex align-items-center">
                                 <span className="me-2">✅</span> Reporte de Ejecución - {ejecucionSeleccionada.titulo_tarea || 'Rutina'}
                             </h5>
                             <button type="button" className="btn-close btn-close-white" onClick={() => setEjecucionSeleccionada(null)}></button>
                         </div>
                         <div className="modal-body p-4 bg-light">
                             <div className="d-flex justify-content-between mb-4 mt-2">
                                 <div>
                                     <p className="text-muted small mb-1 ls-1 fw-bold uppercase">Nombre del Responsable</p>
                                     <h6 className="fw-bold text-dark fs-5">{ejecucionSeleccionada.usuario_que_completo}</h6>
                                 </div>
                                 <div className="text-end">
                                     <p className="text-muted small mb-1 ls-1 fw-bold uppercase">Fecha de Finalización</p>
                                     <h6 className="fw-bold text-dark">{new Date(ejecucionSeleccionada.fecha_completada).toLocaleString()} hs</h6>
                                 </div>
                             </div>

                             {/* SECCIÓN 1: LO QUE SE SOLICITÓ */}
                             <div className="mb-4">
                               <h6 className="fw-bold mb-3 pb-2 border-bottom text-primary"><span className="me-2">📋</span> 1. Orden Solicitada</h6>
                               
                               <div className="mb-3">
                                  <p className="text-muted small mb-1 ls-1 fw-bold uppercase">Título de la Tarea / Orden</p>
                                  <h6 className="fw-bold text-dark fs-6">{ejecucionSeleccionada.titulo_tarea}</h6>
                               </div>

                               {ejecucionSeleccionada.instrucciones_tarea ? (
                                   <div className="bg-white p-3 rounded-4 shadow-sm mb-3 border border-primary border-opacity-10">
                                       <p className="text-muted small mb-2 ls-1 fw-bold uppercase">Instrucciones / Checklist indicados</p>
                                       <style dangerouslySetInnerHTML={{ __html: `
                                           .history-instrucciones ol { padding-left: 20px; margin-bottom: 0; }
                                           .history-instrucciones ul { padding-left: 20px; list-style-type: disc; margin-bottom: 0; }
                                           .history-instrucciones ul li[data-list="check"]::before { content: "☐"; position: absolute; left: -20px; }
                                           .history-instrucciones ul li[data-list="check"] { list-style-type: none; position: relative; }
                                       `}}></style>
                                       <div className="font-monospace text-dark small history-instrucciones" dangerouslySetInnerHTML={{ __html: ejecucionSeleccionada.instrucciones_tarea }}></div>
                                   </div>
                               ) : (
                                   <div className="bg-white p-3 rounded-4 shadow-sm mb-3 border border-light">
                                       <span className="text-muted fst-italic small">No había instrucciones específicas definidas.</span>
                                   </div>
                               )}

                               {ejecucionSeleccionada.planillas_adjuntas_tarea && (() => {
                                   let planillas = [];
                                   try { planillas = JSON.parse(ejecucionSeleccionada.planillas_adjuntas_tarea); } catch(e) { 
                                       if (Array.isArray(ejecucionSeleccionada.planillas_adjuntas_tarea)) planillas = ejecucionSeleccionada.planillas_adjuntas_tarea;
                                   }
                                   if (planillas.length === 0) return null;
                                   return (
                                       <div className="bg-white p-3 rounded-4 shadow-sm border border-info border-opacity-25" style={{ backgroundColor: '#f1f8ff' }}>
                                           <p className="text-muted small mb-2 ls-1 fw-bold uppercase">Plantillas de Referencia en la tarea</p>
                                           <div className="d-flex flex-wrap gap-2">
                                               {planillas.map((arch, idx) => (
                                                   <a key={`ref-${idx}`} href={`${URL_API.replace('/api', '')}/api/tareas/archivo/${arch}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info text-dark d-flex align-items-center gap-1">
                                                       <span>📁</span> <span className="fw-bold">{arch}</span>
                                                   </a>
                                               ))}
                                           </div>
                                       </div>
                                   );
                               })()}
                             </div>

                             {/* SECCIÓN 2: LO QUE SE REPORTÓ */}
                             <div className="mb-2">
                                <h6 className="fw-bold mb-3 pb-2 border-bottom text-success"><span className="me-2">✅</span> 2. Reporte de Finalización</h6>

                                <div className="mb-4">
                                   <p className="text-muted small mb-1 ls-1 fw-bold uppercase">¿Qué se realizó? (Comentarios)</p>
                                   <div className="p-3 bg-white border shadow-sm rounded-4 text-dark" style={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                                       {ejecucionSeleccionada.comentario ? ejecucionSeleccionada.comentario : <span className="text-muted fst-italic">El operario finalizó la tarea sin dejar comentarios.</span>}
                                   </div>
                                </div>

                                {ejecucionSeleccionada.archivo_adjunto && (() => {
                                 let archivos = [];
                                 try { archivos = JSON.parse(ejecucionSeleccionada.archivo_adjunto); } 
                                 catch (e) { archivos = [ejecucionSeleccionada.archivo_adjunto]; }

                                 return (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-dark small">Evidencias Adjuntadas (Fotos, PDF, etc)</label>
                                        <div className="d-flex flex-column gap-2 mt-1">
                                            {archivos.map((file, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={`${URL_API.replace('/api', '')}/api/tareas/archivo/${file}`}
                                                    target="_blank" rel="noreferrer"
                                                    className="d-flex align-items-center justify-content-start bg-white p-3 rounded-3 border shadow-sm text-decoration-none"
                                                >
                                                    <span className="me-3 fs-4">📎</span>
                                                    <span className="small text-dark fw-bold text-truncate">{file}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                 );
                             })()}
                             </div>

                         </div>
                         <div className="modal-footer border-0 p-3 bg-white">
                             <button type="button" className="btn btn-secondary px-5 fw-bold rounded-pill" onClick={() => setEjecucionSeleccionada(null)}>Cerrar Reporte</button>
                         </div>
                     </div>
                 </div>
             </div>
        )}
        </>
    );
};

export default ModalHistorialTarea;
