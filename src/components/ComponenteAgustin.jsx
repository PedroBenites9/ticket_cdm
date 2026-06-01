import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer 
} from 'recharts';

// --- COMPONENTE INTERNO: MODAL DE SUPERVISIÓN DE TAREAS ---
const ModalDetalleTareasGral = ({ tareas, filtroInicial, cerrarModal, indicadores, obtenerTiempo, fueCompletadaHoy }) => {
    const [filtroActivo, setFiltroActivo] = useState(filtroInicial);
    const ahora = new Date().getTime();

    const tareasFiltradas = useMemo(() => {
        return tareas.filter(t => {
            if (filtroActivo === 'TOTAL') return true;

            const completadaHoy = fueCompletadaHoy(t.ultima_vez_completada);
            const tiempo = obtenerTiempo(t.proxima_ejecucion);
            const estado = (t.estado || "").toUpperCase();

            if (filtroActivo === 'FINALIZADAS') return completadaHoy || estado === 'FINALIZADA';
            
            if (completadaHoy || estado === 'FINALIZADA') return false;

            if (filtroActivo === 'ATRASADAS') {
                return tiempo < ahora && !['EN CURSO', 'EN PROCESO', 'PAUSADA', 'EN PAUSA'].includes(estado);
            }
            if (filtroActivo === 'PROCESO') return ['EN CURSO', 'EN PROCESO'].includes(estado);
            if (filtroActivo === 'PAUSA') return ['PAUSADA', 'EN PAUSA'].includes(estado);
            if (filtroActivo === 'PROXIMAS') return tiempo >= ahora;
            return true;
        });
    }, [tareas, filtroActivo, obtenerTiempo, fueCompletadaHoy]);

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <motion.div className="modal-dialog modal-xl modal-dialog-centered" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title">📋 Supervisión de Rutinas: {filtroActivo}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
                    </div>
                    <div className="modal-body bg-light p-4">
                        {/* MINI DASHBOARD INTERNO (5 columnas) */}
                        <div className="row g-2 mb-4">
                            {[
                                { id: 'TOTAL', label: 'Total', cant: tareas.length, color: 'secondary' },
                                { id: 'ATRASADAS', label: 'Atrasadas', cant: indicadores.atrasadas, color: 'danger' },
                                { id: 'PROCESO', label: 'En Proceso', cant: indicadores.proceso, color: 'warning text-dark' },
                                { id: 'PAUSA', label: 'En Pausa', cant: indicadores.pausa, color: 'info text-dark' },
                                { id: 'PROXIMAS', label: 'Próximas', cant: indicadores.proximas, color: 'primary' },
                                { id: 'FINALIZADAS', label: 'Finalizadas', cant: indicadores.finalizadas, color: 'success' }
                            ].map(card => (
                                <div key={card.id} className="col" onClick={() => setFiltroActivo(card.id)} style={{ cursor: 'pointer' }}>
                                    <div className={`card text-center border-0 shadow-sm ${filtroActivo === card.id ? `bg-${card.color.split(' ')[0]} text-white` : 'bg-white'}`}>
                                        <div className="card-body py-2">
                                            <h6 className="mb-0 small">{card.label}</h6>
                                            <h4 className="mb-0 fw-bold">{card.cant}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* TABLA DE SOLO LECTURA */}
                        <div className="table-responsive bg-white rounded shadow-sm" style={{ maxHeight: '400px' }}>
                            <table className="table table-sm table-hover align-middle mb-0">
                                <thead className="table-secondary">
                                    <tr>
                                        <th>Tarea</th>
                                        <th>Categoría</th>
                                        <th>Frecuencia</th>
                                        <th>Próxima Ejecución</th>
                                        <th>Estado Actual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tareasFiltradas.length > 0 ? (
                                        tareasFiltradas.map(t => 
                                            {
                                                const estaFinalizada = fueCompletadaHoy(t.ultima_vez_completada) || (t.estado || "").toUpperCase() === 'FINALIZADA';
                                                
                                                return (
                                                <tr key={t.id} style={{ opacity: estaFinalizada ? 0.6 : 1 }}>
                                                    <td className={`fw-bold ${estaFinalizada ? 'text-decoration-line-through' : ''}`}>
                                                        {t.titulo}
                                                    </td>
                                                    <td><span className="badge bg-light text-dark border">{t.categoria}</span></td>
                                                    <td className="small text-muted">{t.frecuencia}</td>
                                                    <td className="small" style={{ whiteSpace: 'nowrap' }}>
                                                        {t.proxima_ejecucion ? (
                                                            <span className="fw-medium text-secondary">
                                                                {new Date(t.proxima_ejecucion).toLocaleString('es-AR', {
                                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted fst-italic">Sin fecha</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${estaFinalizada ? 'bg-success' : 'bg-secondary opacity-75'}`}>
                                                            {estaFinalizada ? '✔️ Lista por hoy' : (t.estado || 'Pendiente')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                            }
                                        )
                                    ) : (
                                        <tr><td colSpan="5" className="text-center text-muted py-4">No hay tareas en esta sección.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const DashboardAgustin = ({ tickets, tareas, indicadoresTareas, obtenerTiempo, fueCompletadaHoy, usuarioLogueado }) => {
    const [modalGralAbierto, setModalGralAbierto] = useState(false);
    const [filtroSeleccionadoGral, setFiltroSeleccionadoGral] = useState('');

    // --- LÓGICA DE TICKETS (RECHARTS) ---
    const agruparDatos = (propiedad) => {
        const conteo = tickets.reduce((acc, t) => {
            const clave = t[propiedad] || 'Sin especificar';
            acc[clave] = (acc[clave] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(conteo).map(key => ({ nombre: key, cantidad: conteo[key] })).sort((a, b) => b.cantidad - a.cantidad);
    };

    const datosEstado = useMemo(() => {const agrupados = agruparDatos('estado'); return agrupados.filter(item => item.nombre !== 'Cerrado Definitivo');}, [tickets]);
    const datosPrioridad = useMemo(() => agruparDatos('prioridad'), [tickets]);
    const datosArea = useMemo(() => agruparDatos('nombre_area_origen'), [tickets]);
    const datosCategoria = useMemo(() => agruparDatos('categoria'), [tickets]);

    const coloresEstado = { 'Abierto': '#dc3545', 'En Proceso': '#ffc107', 'Resuelto': '#198754' };
    const coloresPrioridad = { 'Urgente': '#dc3545', 'Alta': '#fd7e14', 'Media': '#0d6efd', 'Baja': '#20c997' };
    const coloresGenerales = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const RADIAN = Math.PI / 180;
    const renderEtiquetaPorcentaje = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        if (percent === 0) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="12">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="container-fluid mb-4 animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-secondary m-0">📊 Dashboard Tareas: {usuarioLogueado || 'Coordinador'}</h3>
                <span className="badge bg-dark">Vista de Supervisión Gral.</span>
            </div>
            
            {/* --- SECCIÓN 1: DASHBOARD DE TAREAS (5 COLUMNAS) --- */}
            <div className="row g-3 mb-5">
                {[
                    { id: 'TOTAL', title: 'TOTAL', value: tareas.length, color: 'secondary' },
                    { id: 'ATRASADAS', title: 'ATRASADAS', value: indicadoresTareas.atrasadas, color: 'danger' },
                    { id: 'PROCESO', title: 'EN PROCESO', value: indicadoresTareas.proceso, color: 'warning text-dark' },
                    { id: 'PAUSA', title: 'EN PAUSA', value: indicadoresTareas.pausa, color: 'info text-dark' },
                    { id: 'PROXIMAS', title: 'PRÓXIMAS', value: indicadoresTareas.proximas, color: 'primary' },
                    { id: 'FINALIZADAS', title: 'FINALIZADAS', value: indicadoresTareas.finalizadas, color: 'success' } // 👈 LA NUEVA TARJETA
                ].map(card => (
                    <div key={card.id} className="col-12 col-sm-6 col-md"> {/* 👈 'col-md' hace que se dividan el espacio automáticamente */}
                        <motion.div 
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className={`card bg-${card.color.split(' ')[0]} ${card.color.includes('text-dark') ? 'text-dark' : 'text-white'} shadow-sm border-0 h-100`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setFiltroSeleccionadoGral(card.id); setModalGralAbierto(true); }}
                        >
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 opacity-75" style={{fontSize: '0.8rem'}}>{card.title}</h6>
                                    <h2 className="mb-0 fw-bold">{card.value}</h2>
                                </div>
                                <i className="fa-solid fa-chevron-right opacity-50"></i>
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>

            {/* --- SECCIÓN 2: GRÁFICOS DE TICKETS (SIN CAMBIOS) --- */}
            <div className="row g-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-secondary m-0">📊 Dashboard de Tickets (Coordinador General)</h3>
            </div>
                <div className="col-md-6 col-lg-3">
                    
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-body">
                            <h6 className="card-title text-center fw-bold text-muted mb-3">Estados de Tickets</h6>
                            <div style={{ height: '220px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={datosEstado} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="cantidad" nameKey="nombre">
                                            {datosEstado.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={coloresEstado[entry.nombre] || coloresGenerales[index % coloresGenerales.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-lg-3">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-body">
                            <h6 className="card-title text-center fw-bold text-muted mb-3">Prioridades</h6>
                            <div style={{ height: '220px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={datosPrioridad} dataKey="cantidad" nameKey="nombre" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderEtiquetaPorcentaje}>
                                            {datosPrioridad.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={coloresPrioridad[entry.nombre] || coloresGenerales[index % coloresGenerales.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-12 col-lg-6">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-body">
                            <h6 className="card-title fw-bold text-muted mb-3">Tickets por Área</h6>
                            <div style={{ height: '220px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={datosArea}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="nombre" tick={{fontSize: 10}} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="cantidad" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL DE DETALLE DE TAREAS --- */}
            <AnimatePresence>
                {modalGralAbierto && (
                    <ModalDetalleTareasGral 
                        tareas={tareas}
                        filtroInicial={filtroSeleccionadoGral}
                        cerrarModal={() => setModalGralAbierto(false)}
                        obtenerTiempo={obtenerTiempo}
                        fueCompletadaHoy={fueCompletadaHoy}
                        indicadores={indicadoresTareas}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};