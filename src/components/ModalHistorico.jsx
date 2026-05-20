import React, { useState } from 'react';

export const ModalHistorico = ({ tickets, cerrarModal, areasDisponibles }) => {
    // Estados locales, ¡solo existen dentro del modal!
    const [filtroFechaHist, setFiltroFechaHist] = useState('');
    const [filtroAreaHist, setFiltroAreaHist] = useState('');

    // Lógica de filtrado
    const ticketsHistoricos = tickets.filter(ticket => {
        // 1. OBLIGATORIO: Solo mostrar los cerrados
        if (ticket.estado !== 'Cerrado Definitivo') return false;

        // 2. Filtro de Área
        if (filtroAreaHist && ticket.area_origen !== filtroAreaHist) return false;

        // 3. Filtro de Fecha (Asumiendo que tenés fecha_resolucion)
        if (filtroFechaHist && !ticket.fecha_resolucion?.includes(filtroFechaHist)) return false;

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
                                    <option value="Operaciones">Operaciones</option>
                                    <option value="Tesoreria">Tesorería</option>
                                    <option value="Sindico">Síndico</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Logistica">Logística</option>
                                    <option value="RRHH">RRHH</option>
                                    <option value="Incorporaciones">Incorporaciones</option>
                                    <option value="Habilitaciones">Habilitaciones</option>
                                    <option value="Tecnologia">Tecnología (IT)</option>
                                    <option value="Presidencia">Presidencia</option>
                                    <option value="CoordinadorGral">Coordinador Gral.</option>
                                    
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
                                            <tr key={ticket.id}>
                                                <td className="fw-bold">{ticket.codigo}</td>
                                                {console.log(ticket.id_area)}
                                                {console.log( tickets )}
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