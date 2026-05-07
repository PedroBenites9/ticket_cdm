import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer 
} from 'recharts';

export const DashboardAgustin = ({ tickets }) => {

    // 🧠 1. EL CEREBRO: Función genérica para contar tickets según la propiedad que le pidamos
    const agruparDatos = (propiedad) => {
        const conteo = tickets.reduce((acumulador, ticket) => {
            const clave = ticket[propiedad] || 'Sin especificar';
            acumulador[clave] = (acumulador[clave] || 0) + 1;
            return acumulador;
        }, {});
        
        // Convertimos el objeto en el formato de Array que pide Recharts [{name: 'Alta', valor: 5}]
        return Object.keys(conteo).map(key => ({
            nombre: key,
            cantidad: conteo[key]
        })).sort((a, b) => b.cantidad - a.cantidad); // Ordenamos de mayor a menor
    };

    // 📊 2. PROCESAMOS LOS DATOS
    const datosEstado = useMemo(() => agruparDatos('estado'), [tickets]);
    const datosPrioridad = useMemo(() => agruparDatos('prioridad'), [tickets]);
    const datosArea = useMemo(() => agruparDatos('area_origen'), [tickets]);
    const datosCategoria = useMemo(() => agruparDatos('categoria'), [tickets]);

    // 🎨 3. PALETAS DE COLORES
    const coloresEstado = { 'Abierto': '#dc3545', 'En Proceso': '#ffc107', 'Resuelto': '#198754', 'Cerrado Definitivo': '#343a40' };
    const coloresPrioridad = { 'Urgente': '#dc3545', 'Alta': '#fd7e14', 'Media': '#0d6efd', 'Baja': '#20c997' };
    const coloresGenerales = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="container-fluid mb-4 animate__animated animate__fadeIn">
            <h3 className="text-secondary mb-4">📊 Dashboard General de Tickets</h3>
            
            <div className="row g-4">
                
                {/* GRÁFICO 1: ESTADO (Donut) */}
                <div className="col-md-6 col-lg-3">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-body">
                            <h6 className="card-title text-center fw-bold text-muted mb-3">Distribución por Estado</h6>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={datosEstado} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="cantidad" nameKey="nombre">
                                            {datosEstado.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={coloresEstado[entry.nombre] || coloresGenerales[index % coloresGenerales.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRÁFICO 2: PRIORIDAD (Pie) */}
                <div className="col-md-6 col-lg-3">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-body">
                            <h6 className="card-title text-center fw-bold text-muted mb-3">Tickets por Prioridad</h6>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={datosPrioridad} outerRadius={80} dataKey="cantidad" nameKey="nombre">
                                            {datosPrioridad.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={coloresPrioridad[entry.nombre] || coloresGenerales[index % coloresGenerales.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRÁFICO 3: ÁREAS (Barras) */}
                <div className="col-md-12 col-lg-6">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-body">
                            <h6 className="card-title fw-bold text-muted mb-3">Volumen por Área</h6>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={datosArea} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="nombre" tick={{fontSize: 12}} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip cursor={{fill: '#f8f9fa'}} />
                                        <Bar dataKey="cantidad" fill="#0d6efd" radius={[4, 4, 0, 0]} name="Tickets" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRÁFICO 4: CATEGORÍAS (Barras Horizontales) */}
                <div className="col-12">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <h6 className="card-title fw-bold text-muted mb-3">Incidencias por Categoría</h6>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={datosCategoria} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} />
                                        <YAxis dataKey="nombre" type="category" width={150} tick={{fontSize: 12}} />
                                        <Tooltip cursor={{fill: '#f8f9fa'}} />
                                        <Bar dataKey="cantidad" fill="#20c997" radius={[0, 4, 4, 0]} name="Tickets" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};