import React from 'react';

const ModalTarea = ({ 
  mostrarModalTarea, setMostrarModalTarea, 
  formularioTarea, setFormularioTarea, manejarDias, guardarTarea 
}) => {
  if (!mostrarModalTarea) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <h5 className="modal-title fw-bold text-secondary">
            {formularioTarea.id ? "✏️ Editar Rutina" : "Programar Rutina"}
            </h5>
            <button type="button" className="btn-close" onClick={() => setMostrarModalTarea(false)}></button>
          </div>
          <div className="modal-body">
            <form id="formTarea" onSubmit={guardarTarea}>
              <div className="mb-3">
                <label className="form-label fw-bold">¿Qué se debe realizar?</label>
                <input type="text" className="form-control" value={formularioTarea.titulo} onChange={(e) => setFormularioTarea({...formularioTarea, titulo: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Categoría</label>
                <select 
                    className="form-select border-primary" 
                    value={formularioTarea.frecuencia} 
                    onChange={(e) => {
                        const nuevaFrecuencia = e.target.value;
                        setFormularioTarea({
                        ...formularioTarea, 
                        frecuencia: nuevaFrecuencia,
                        // 🧹 MAGIA: Limpiamos los datos del otro modo para no enviar basura a la BD
                        dias_especificos: nuevaFrecuencia === 'Fecha Unica' ? [] : formularioTarea.dias_especificos,
                        fecha_unica: nuevaFrecuencia === 'Dias Especificos' ? '' : formularioTarea.fecha_unica
                        });
                    }}
                >   
                    <option value="Limpieza / General">🧹 Limpieza</option>
                    <option value="CCTV y Servidores">📹 CCTV</option>
                    <option value="Redes">🌐 Redes</option>
                    <option value="Reportes">📑 Reportes</option>
                </select>
              </div>
              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label fw-bold">Frecuencia</label>
                  <select className="form-select" value={formularioTarea.frecuencia} onChange={(e) => setFormularioTarea({...formularioTarea, frecuencia: e.target.value})}>
                    <option value="Dias Especificos">📅 Días Específicos</option>
                    <option value="Fecha Unica">🎯 Tarea Mensual</option>
                  </select>
                </div>
                <div className="col-6 mb-3">
                  <label className="form-label fw-bold">Hora Límite</label>
                  <input type="time" className="form-control" value={formularioTarea.hora_programada} onChange={(e) => setFormularioTarea({...formularioTarea, hora_programada: e.target.value})} required />
                </div>
              </div>
              {formularioTarea.frecuencia === 'Dias Especificos' && (
                <div className="mb-3 p-3 bg-light border rounded shadow-sm">
                  <div className="d-flex flex-wrap gap-2 justify-content-between">
                    {[{id: 1, label: 'Lun'}, {id: 2, label: 'Mar'}, {id: 3, label: 'Mié'}, {id: 4, label: 'Jue'}, {id: 5, label: 'Vie'}, {id: 6, label: 'Sáb'}, {id: 0, label: 'Dom'}].map(dia => (
                      <div className="form-check form-check-inline me-0" key={dia.id}>
                        <input className="form-check-input" type="checkbox" checked={formularioTarea.dias_especificos?.includes(dia.id)} onChange={() => manejarDias(dia.id)} />
                        <label className="form-check-label small">{dia.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formularioTarea.frecuencia === 'Fecha Unica' && (
                  <input type="date" className="form-control" value={formularioTarea.fecha_unica} onChange={(e) => setFormularioTarea({...formularioTarea, fecha_unica: e.target.value})} required />
              )}
            </form>
          </div>
          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={() => setMostrarModalTarea(false)}>Cancelar</button>
            <button type="submit" form="formTarea" className="btn btn-success">
              {formularioTarea.id ? "Guardar Cambios" : "Guardar Rutina"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTarea;
