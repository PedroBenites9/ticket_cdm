import React, { useState, useEffect } from 'react';

const ModalHistorialTarea = ({ mostrar, setMostrar, tareaId, URL_API }) => {
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState('');

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
                                            <th className="py-3">Reporte / Comentario</th>
                                            <th className="py-3 text-center">Evidencias</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialFiltrado.map((h) => (
                                            <tr key={h.id}>
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
                                                <td style={{ maxWidth: '300px' }}>
                                                    <p className="mb-0 text-dark small text-truncate-2" title={h.comentario}>
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
                                                                            onClick={() => window.open(url, '_blank')}
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
    );
};

export default ModalHistorialTarea;
