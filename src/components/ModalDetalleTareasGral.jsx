import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function ModalDetalleTareasGral({ 
    tareas, 
    filtroInicial, 
    cerrarModal, 
    indicadores, // Recibe las cantidades (Atrasadas, Proceso, etc.)
    obtenerTiempo 
}) {
    // El estado del filtro interno del modal
    const [filtroActivo, setFiltroActivo] = useState(filtroInicial);

    const ahora = new Date().getTime();

    // Lógica de filtrado idéntica a la del Dashboard principal
    const tareasFiltradas = useMemo(() => {
        return tareas.filter(t => {
            const tiempo = obtenerTiempo(t.proxima_ejecucion);
            const estado = (t.estado || "").toUpperCase();

            if (filtroActivo === 'ATRASADAS') {
                return tiempo < ahora && estado !== 'EN CURSO' && estado !== 'EN PROCESO' && estado !== 'PAUSADA' && estado !== 'EN PAUSA' && estado !== 'FINALIZADA';
            }
            if (filtroActivo === 'PROCESO') {
                return estado === 'EN CURSO' || estado === 'EN PROCESO';
            }
            if (filtroActivo === 'PAUSA') {
                return estado === 'PAUSADA' || estado === 'EN PAUSA';
            }
            if (filtroActivo === 'PROXIMAS') {
                return tiempo >= ahora && estado !== 'FINALIZADA';
            }
            return true;
        });
    }, [tareas, filtroActivo]);

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <motion.div 
                className="modal-dialog modal-xl modal-dialog-centered"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">🔍 Detalle de Supervisión: {filtroActivo}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
                    </div>

                    <div className="modal-body bg-light p-4">
                        {/* MINI DASHBOARD INTERNO (Navegación) */}
                        <div className="row g-2 mb-4">
                            {[
                                { id: 'ATRASADAS', label: 'Atrasadas', cant: indicadores.atrasadas, color: 'danger' },
                                { id: 'PROCESO', label: 'En Proceso', cant: indicadores.proceso, color: 'warning' },
                                { id: 'PAUSA', label: 'En Pausa', cant: indicadores.pausa, color: 'info' },
                                { id: 'PROXIMAS', label: 'Próximas', cant: indicadores.proximas, color: 'primary' }
                            ].map(card => (
                                <div key={card.id} className="col-md-3" onClick={() => setFiltroActivo(card.id)} style={{ cursor: 'pointer' }}>
                                    <div className={`card text-center border-0 shadow-sm ${filtroActivo === card.id ? `bg-${card.color} text-white` : 'bg-white'}`}>
                                        <div className="card-body py-2">
                                            <h6 className="mb-0 small">{card.label}</h6>
                                            <h4 className="mb-0 fw-bold">{card.cant}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TABLA DE SOLO LECTURA */}
                        <div className="table-responsive bg-white rounded shadow-sm" style={{ maxHeight: '450px' }}>
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Tarea</th>
                                        <th>Categoría</th>
                                        <th>Frecuencia</th>
                                        <th>Próxima Ejecución</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tareasFiltradas.length > 0 ? (
                                        tareasFiltradas.map(t => (
                                            <tr key={t.id}>
                                                <td className="fw-bold">{t.titulo}</td>
                                                <td><span className="badge bg-secondary">{t.categoria}</span></td>
                                                <td className="small">{t.frecuencia}</td>
                                                <td>{t.proxima_ejecucion}</td>
                                                <td>
                                                    <span className={`badge bg-${filtroActivo === 'ATRASADAS' ? 'danger' : 'secondary'}`}>
                                                        {t.estado || 'Pendiente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center py-4">No hay tareas en este estado.</td></tr>
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