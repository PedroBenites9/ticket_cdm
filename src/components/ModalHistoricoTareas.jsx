import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function ModalHistoricoTareas({ historial, cerrarModal, URL_API }) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroUsuario, setFiltroUsuario] = useState('Todos');

    // Extraemos usuarios únicos para el filtro
    const usuariosUnicos = useMemo(() => {
        const usuarios = historial.map(h => h.usuario_que_completo).filter(Boolean);
        return ['Todos', ...new Set(usuarios)];
    }, [historial]);

    // Lógica de filtrado
    const historialFiltrado = useMemo(() => {
        return historial.filter(item => {
            const coincideTexto = 
                item.titulo_tarea?.toLowerCase().includes(busqueda.toLowerCase()) ||
                item.usuario_que_completo?.toLowerCase().includes(busqueda.toLowerCase());
            
            const coincideUsuario = filtroUsuario === 'Todos' || item.usuario_que_completo === filtroUsuario;
            
            return coincideTexto && coincideUsuario;
        });
    }, [historial, busqueda, filtroUsuario]);

    // Función para manejar la descarga del archivo
    const manejarDescarga = (rutaFisica, URL_API) => {
        if (!rutaFisica) return;

        // 1. Extraemos SOLO el nombre del archivo
        const nombreArchivo = rutaFisica.split(/[\/\\]/).pop();

        // 2. Armamos la URL que coincide EXACTAMENTE con el app.use() de tu index.js
        const urlDescarga = `${URL_API}/tareas/archivo/${nombreArchivo}`;

        // 3. Abrimos la imagen o PDF en una pestaña nueva
        window.open(urlDescarga, '_blank');
    };

    // Helper para determinar el ícono y color según la extensión
    const obtenerInfoArchivo = (ruta) => {
        if (!ruta) return { icono: '📎', color: 'btn-outline-secondary', texto: 'Descargar' };
        
        // Extraemos la extensión (ej: "jpg", "pdf", "docx")
        const extension = ruta.split('.').pop().toLowerCase();

        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return { icono: '🖼️', color: 'btn-outline-info', texto: 'Imagen' };
            case 'pdf':
                return { icono: '📕', color: 'btn-outline-danger', texto: 'PDF' };
            case 'doc':
            case 'docx':
                return { icono: '📘', color: 'btn-outline-primary', texto: 'Word' };
            case 'xls':
            case 'xlsx':
            case 'csv':
                return { icono: '📗', color: 'btn-outline-success', texto: 'Excel' };
            case 'zip':
            case 'rar':
                return { icono: '📦', color: 'btn-outline-dark', texto: 'Zip' };
            case 'txt':
            case 'log':
                return { icono: '📝', color: 'btn-outline-secondary', texto: 'Texto' };
            default:
                return { icono: '⬇️', color: 'btn-outline-primary', texto: 'Descargar' };
        }
    };
    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <motion.div 
                className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title">
                            🗄️ Historial de Tareas Finalizadas
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
                    </div>

                    <div className="modal-body bg-light p-4">
                        {/* Filtros */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="input-group shadow-sm">
                                    <span className="input-group-text bg-white">🔍</span>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Buscar por tarea o usuario..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select shadow-sm"
                                    value={filtroUsuario}
                                    onChange={(e) => setFiltroUsuario(e.target.value)}
                                >
                                    {usuariosUnicos.map(user => (
                                        <option key={user} value={user}>{user}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="table-responsive rounded shadow-sm bg-white">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Tarea Realizada</th>
                                        <th>Completado por</th>
                                        <th>Tiempo Dedicado</th>
                                        <th className="text-center">Archivo Adjunto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialFiltrado.length > 0 ? (
                                        historialFiltrado.map((item) => (
                                            <tr key={item.id}>
                                                <td className="text-muted fw-bold">#{item.id}</td>
                                                <td className="fw-semibold">{item.titulo_tarea}</td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {item.usuario_que_completo}
                                                    </span>
                                                </td>
                                                <td>
                                                    {Math.round(item.tiempo_total_minutos || 0)} min
                                                </td>
                                                <td className="text-center">
                                                    {item.archivo_adjunto ? (
                                                        (() => {
                                                            const info = obtenerInfoArchivo(item.archivo_adjunto);
                                                            return (
                                                                <button 
                                                                    onClick={() => manejarDescarga(item.archivo_adjunto)}
                                                                    className={`btn btn-sm ${info.color} d-inline-flex align-items-center gap-1`}
                                                                    title={`Descargar archivo .${item.archivo_adjunto.split('.').pop()}`}
                                                                >
                                                                    <span style={{ fontSize: '1.1rem' }}>{info.icono}</span> {info.texto}
                                                                </button>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                            Sin archivo
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted">
                                                No hay registros en el historial.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}