import React, { useState, useRef, useEffect } from 'react';

const DropdownReporte = ({ exportarHistorialTareas }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados del calendario
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica de fechas
  const diasEnMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
  const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay();
  const nombreMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const diasSemana = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  const cambiarMes = (incremento) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + incremento, 1));
  };

  const manejarClicDia = (dia) => {
    const fechaSeleccionada = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    if (!fechaInicio || (fechaInicio && fechaFin)) {
      setFechaInicio(fechaSeleccionada);
      setFechaFin(null);
    } else if (fechaSeleccionada < fechaInicio) {
      setFechaInicio(fechaSeleccionada);
    } else {
      setFechaFin(fechaSeleccionada);
    }
  };

  // 🎨 ACÁ SUCEDE LA MAGIA DE "PINTAR EL RANGO"
  const obtenerClasesDia = (dia) => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).getTime();
    const inicio = fechaInicio?.getTime();
    const fin = fechaFin?.getTime();
    const hover = hoverDate?.getTime();

    let clases = "p-1 mb-1 rounded cursor-pointer d-flex justify-content-center align-items-center ";
    
    if (fecha === inicio || fecha === fin) {
      clases += "bg-primary text-white fw-bold shadow-sm"; // Extremos seleccionados
    } else if (inicio && fin && fecha > inicio && fecha < fin) {
      clases += "bg-primary text-primary fw-bold";
      clases = clases.replace('bg-primary', 'bg-primary bg-opacity-25'); // Rango pintado
    } else if (inicio && !fin && hover && fecha > inicio && fecha <= hover) {
      clases += "bg-primary";
      clases = clases.replace('bg-primary', 'bg-primary bg-opacity-10'); // Hover predictivo
    } else {
      clases += "text-dark";
    }
    return clases;
  };

  const handleDescargarRango = () => {
    exportarHistorialTareas(fechaInicio, fechaFin);
    setIsOpen(false);
  };

  const handleDescargarTodo = () => {
    exportarHistorialTareas(null, null); // Pasamos null para que exporte TODO
    setIsOpen(false);
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Botón Principal (El que dibujaste en tu boceto) */}
      <button 
        className="btn btn-success fw-bold shadow-sm d-flex align-items-center gap-2" 
        onClick={() => setIsOpen(!isOpen)}
      >
        📊 Descargar Excel {isOpen ? '▲' : '▼'}
      </button>

      {/* Menú Desplegable (Dropbox) */}
      {isOpen && (
        <div 
          className="position-absolute bg-white shadow-lg border rounded-3 p-3 mt-2" 
          style={{ top: '100%', right: '0', left: '30vh', width: '320px', zIndex: 1050 }}
        >
          {/* Opción 1: Todo el historial */}
          <button className="btn btn-outline-dark w-100 fw-bold mb-3 d-flex justify-content-between align-items-center" onClick={handleDescargarTodo}>
            <span>📁 Historial Completo</span>
            <span className="badge bg-secondary">Todas las fechas</span>
          </button>

          <hr className="text-muted opacity-25" />

          {/* Opción 2: Rango de Fechas (Estilo Rentas GO) */}
          <h6 className="fw-bold text-primary mb-3 mt-2">📍 Seleccionar Rango</h6>
          
          {/* Cabecera del Calendario */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <button className="btn btn-sm btn-light border" onClick={() => cambiarMes(-1)}>◀</button>
            <span className="fw-bold text-dark">{nombreMeses[mesActual.getMonth()]} {mesActual.getFullYear()}</span>
            <button className="btn btn-sm btn-light border" onClick={() => cambiarMes(1)}>▶</button>
          </div>

          {/* Grilla del Calendario */}
          <div className="d-grid text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', fontSize: '0.85rem' }}>
            {diasSemana.map(d => <div key={d} className="fw-bold text-muted small">{d}</div>)}
            {Array.from({ length: primerDiaMes }).map((_, i) => <div key={`empty-${i}`}></div>)}
            
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const dia = i + 1;
              return (
                <div 
                  key={dia} 
                  className={obtenerClasesDia(dia)}
                  style={{ height: '32px', transition: 'all 0.1s' }}
                  onClick={() => manejarClicDia(dia)}
                  onMouseEnter={() => setHoverDate(new Date(mesActual.getFullYear(), mesActual.getMonth(), dia))}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  {dia}
                </div>
              );
            })}
          </div>

          {/* Botón Aplicar */}
          <button 
            className="btn btn-primary w-100 mt-3 fw-bold shadow-sm" 
            disabled={!fechaInicio || !fechaFin}
            onClick={handleDescargarRango}
          >
            Aplicar Rango y Descargar
          </button>
        </div>
      )}
    </div>
  );
};

export default DropdownReporte;