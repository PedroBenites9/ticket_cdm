import React, { useState } from 'react';

export const ModalHistorico = ({ tickets, cerrarModal, areasDisponibles, abrirModalTicket }) => {
    // Estados locales, ¡solo existen dentro del modal!
    const [filtroFechaHist, setFiltroFechaHist] = useState('');
    const [filtroAreaHist, setFiltroAreaHist] = useState('');

    // Lógica de filtrado
    const ticketsHistoricos = tickets.filter(ticket => {
    // 1. OBLIGATORIO: Solo mostrar los cerrados
    if (ticket.estado !== 'Cerrado Definitivo') return false;

    //s 2. Filtro de Área
    if (filtroAreaHist && String(ticket.id_area) !== String(filtroAreaHist)) return false;

    // 3. Filtro de Fecha normalizado (Evita romper por zonas horarias/formatos de texto)
    if (filtroFechaHist) {
        if (!ticket.fecha_finalizado) return false;

        // Parseamos la fecha del ticket y la del filtro a objetos Date nativos
        const fechaTicket = new Date(ticket.fecha_finalizado);
        
        // El input 'date' devuelve "YYYY-MM-DD" en UTC local. 
        // Para evitar desfases de huso horario, lo parseamos separando sus componentes.
        const [anoFiltro, mesFiltro, diaFiltro] = filtroFechaHist.split('-').map(Number);

        // Comparamos año, mes (0-indexed en JS) y día de forma exacta
        const coincideAno = fechaTicket.getFullYear() === anoFiltro;
        const coincideMes = fechaTicket.getMonth() === (mesFiltro - 1);
        const coincideDia = fechaTicket.getDate() === diaFiltro;

        if (!coincideAno || !coincideMes || !coincideDia) return false;
    }

    return true;
});
    // Función para poner la fecha linda y legible
    const formatearFecha = (fechaDb) => {
        if (!fechaDb) return 'Sin fecha';
        
        const fecha = new Date(fechaDb);
        return fecha.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title">🗄️ Histórico de Tickets (Cerrados Definitivos)</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
                    </div>

                    <div className="modal-body bg-light">
                        {/* FILTROS EXCLUSIVOS DEL HISTÓRICO */}
                        <div className="d-flex gap-3 mb-4 p-3 bg-white border rounded shadow-sm">
                            <div>
                                <label className="form-label text-muted small fw-bold mb-1">Buscar por Fecha</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={filtroFechaHist}
                                    onChange={(e) => setFiltroFechaHist(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="form-label text-muted small fw-bold mb-1">Filtrar por Área</label>
                                <select className="form-select" value={filtroAreaHist} onChange={(e) => setFiltroAreaHist(e.target.value)}>
                                    <option value="">Todas las Áreas</option>
                                    {areasDisponibles.map(area => (
                                        <option key={area.id} value={area.id}>{area.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* TABLA DEL HISTÓRICO */}
                        <div className="table-responsive bg-white rounded border">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Código</th>
                                        <th>Asunto</th>
                                        <th>Área</th>
                                        <th>Fecha Cierre</th>
                                        <th>Técnico</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ticketsHistoricos.length > 0 ? (
                                        ticketsHistoricos.map(ticket => (
                                            <tr 
                                                key={ticket.id} 
                                                onClick={() => abrirModalTicket && abrirModalTicket(ticket)}
                                                style={{ cursor: abrirModalTicket ? 'pointer' : 'default' }}
                                                title="Ver detalle del ticket"
                                                className="table-row-hover"
                                            >
                                                <td className="fw-bold">{ticket.codigo}</td>
                                                <td>{ticket.asunto}</td>
                                                <td>{areasDisponibles.find(area => area.id == ticket.id_area)?.nombre || 'Sin Área'}</td>
                                                <td>{formatearFecha(ticket.fecha_finalizado) || 'Sin fecha'}</td>
                                                <td>{ticket.tecnico_asignado || 'N/A'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center py-4">No hay tickets históricos que coincidan con estos filtros.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};