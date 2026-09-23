import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ModalTarea = ({
    mostrarModalTarea, setMostrarModalTarea,
    formularioTarea, setFormularioTarea, manejarDias, guardarTarea,
    URL_API
}) => {
    
    // 1. PRIMERO SIEMPRE LOS HOOKS
    const [opciones, setOpciones] = useState({ categorias: [], frecuencias: [] });

    useEffect(() => {
        if (!mostrarModalTarea) return; // Solo carga si el modal está abierto
        const cargarOpciones = async () => {
            try {
                const respuesta = await fetch(`${URL_API}/tareas/configuracion/opciones`);
                const datos = await respuesta.json();
                setOpciones(datos);
            } catch (error) {
                console.error("Error cargando opciones del servidor", error);
            }
        };
        cargarOpciones();
        cargarOpciones();
    }, [URL_API, mostrarModalTarea]); 

    // Funciones para adjuntos
    const alSubirNuevosArchivos = (e) => {
        const files = Array.from(e.target.files);
        if(!files.length) return;
        const nuevosArr = formularioTarea.archivosNuevosParaBD ? [...formularioTarea.archivosNuevosParaBD, ...files] : files;
        setFormularioTarea(prev => ({ ...prev, archivosNuevosParaBD: nuevosArr }));
    };

    const quitarArchivoNuevo = (index) => {
        const nuevos = [...(formularioTarea.archivosNuevosParaBD || [])];
        nuevos.splice(index, 1);
        setFormularioTarea(prev => ({ ...prev, archivosNuevosParaBD: nuevos }));
    };

    const quitarArchivoViejo = (index) => {
        let viejos = [];
        if (typeof formularioTarea.planillas_adjuntas === 'string') {
            try { viejos = JSON.parse(formularioTarea.planillas_adjuntas); } catch(e){}
        } else if (Array.isArray(formularioTarea.planillas_adjuntas)) {
            viejos = [...formularioTarea.planillas_adjuntas];
        } else {
            return;
        }
        viejos.splice(index, 1);
        setFormularioTarea(prev => ({ ...prev, planillas_adjuntas: viejos }));
    };
    
    // Convertir viejos a renderizar
    let listaViejos = [];
    if (formularioTarea.planillas_adjuntas) {
        if (typeof formularioTarea.planillas_adjuntas === 'string') {
            try { listaViejos = JSON.parse(formularioTarea.planillas_adjuntas); } catch(e){}
        } else if (Array.isArray(formularioTarea.planillas_adjuntas)) {
            listaViejos = formularioTarea.planillas_adjuntas;
        }
    }

    // 2. RECIÉN AHORA EL RETURN TEMPRANO
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
                
            {/* SELECT DE CATEGORÍA DINÁMICO */}
                <label className="form-label fw-bold">Categoría</label>
                <select 
                  className="form-select border-primary" 
                  value={formularioTarea.categoria || ''} 
                  onChange={(e) => setFormularioTarea({ ...formularioTarea, categoria: e.target.value })}
                  required
                  >
                  <option value="">Seleccione Categoría...</option>
                  {opciones.categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

             <div className="row">
                  <div className="col-12 mb-3">
                      <label className="form-label fw-bold">Frecuencia</label>
                      <select 
                          className="form-select"
                          value={formularioTarea.frecuencia || ''}
                          onChange={(e) => {
                              const nuevaFrecuencia = e.target.value;
                              setFormularioTarea({
                                  ...formularioTarea,
                                  frecuencia: nuevaFrecuencia,
                                  dias_especificos: nuevaFrecuencia === 'Fecha Unica' ? [] : formularioTarea.dias_especificos,
                                  fecha_unica: nuevaFrecuencia === 'Dias Especificos' ? '' : formularioTarea.fecha_unica
                              });
                          }}
                          required
                      >
                          <option value="">Seleccione...</option>
                          {opciones.frecuencias.map((frec) => (
                              <option key={frec.codigo} value={frec.codigo}>
                                  {frec.nombre_mostrar}
                              </option>
                          ))}
                      </select>
                      
                      {formularioTarea.frecuencia && (
                          <div className="alert alert-info mt-3 py-2 px-3 mb-0 small border-0 text-primary-emphasis d-flex align-items-center rounded-3" style={{ backgroundColor: 'rgba(13, 110, 253, 0.08)' }}>
                                <div>
                                    {formularioTarea.frecuencia === 'Dias Especificos' && (
                                        <><strong>💡 Días Específicos:</strong> Ideal para rutinas que se repiten siempre en los mismos días de la semana.<br/><span className="opacity-75" style={{fontSize: '0.8rem'}}><em>Ejemplo: Hacer el Backup del servidor todos los Lunes y Jueves.</em></span></>
                                    )}
                                    {formularioTarea.frecuencia === 'Fecha Unica' && (
                                        <><strong>💡 Fecha Única:</strong> La tarea se ejecutará una sola vez en el día exacto elegido y luego se archivará definitivamente.<br/><span className="opacity-75" style={{fontSize: '0.8rem'}}><em>Ejemplo: Visita excepcional de mantenimiento del 15 de Octubre.</em></span></>
                                    )}
                                    {formularioTarea.frecuencia === 'Quincenal' && (
                                        <><strong>💡 Quincenal:</strong> El sistema reprogramará la rutina automáticamente de a 15 días exactos en el calendario.<br/><span className="opacity-75" style={{fontSize: '0.8rem'}}><em>Ejemplo: Limpieza profunda de los servidores rackeables.</em></span></>
                                    )}
                                    {formularioTarea.frecuencia !== 'Dias Especificos' && formularioTarea.frecuencia !== 'Fecha Unica' && formularioTarea.frecuencia !== 'Quincenal' && (
                                        <><strong>💡 {formularioTarea.frecuencia}:</strong> Se calculará el próximo salto automáticamente en base a tu elección y el calendario.</>
                                    )}
                                </div>
                          </div>
                      )}
                  </div>
              </div>
              {formularioTarea.frecuencia === 'Dias Especificos' ? (
                <div className="mb-3 p-3 bg-light border rounded shadow-sm">
                  {/* PASO 1: LOS CHECKBOXES */}
                  <label className="form-label fw-bold small text-secondary mb-3">1. Seleccioná los días de ejecución</label>
                  <div className="d-flex flex-wrap gap-2 justify-content-between mb-3 border-bottom pb-3">
                    {[{id: 1, label: 'Lun'}, {id: 2, label: 'Mar'}, {id: 3, label: 'Mié'}, {id: 4, label: 'Jue'}, {id: 5, label: 'Vie'}, {id: 6, label: 'Sáb'}, {id: 0, label: 'Dom'}].map(dia => (
                      <div className="form-check form-check-inline me-0" key={dia.id}>
                        <input className="form-check-input" type="checkbox" checked={formularioTarea.dias_especificos?.includes(dia.id)} onChange={() => manejarDias(dia.id)} />
                        <label className="form-check-label small fw-bold">{dia.label}</label>
                      </div>
                    ))}
                  </div>


                </div>            
                   ) : (
                    /* 2. VISTA PARA EL RESTO DE LAS FRECUENCIAS (Calendario) */
                    <div className="mb-3">
                      <label className="form-label text-secondary fw-bold" style={{ fontSize: '0.9rem' }}>
                        {formularioTarea.frecuencia === 'Fecha Unica' 
                          ? 'Seleccione la fecha exacta' 
                          : 'Fecha de Inicio (Primera Ejecución)'}
                      </label>
                      <input 
                        type="date" 
                        className="form-control shadow-sm"
                        value={formularioTarea.fecha_unica} 
                        onChange={(e) => setFormularioTarea({ ...formularioTarea, fecha_unica: e.target.value })}
                        required
                      />
                      {formularioTarea.frecuencia !== 'Fecha Unica' && (
                        <div className="form-text mt-1" style={{ fontSize: '0.8rem' }}>
                          A partir de esta fecha, el sistema calculará los próximos saltos automáticamente.
                        </div>
                      )}
                    </div>
                  )    
            }
              <div className="mb-3">
                <label className="form-label fw-bold">Instrucciones / Checklist </label>
                <ReactQuill 
                    theme="snow"
                    value={formularioTarea.descripcion || ''}
                    onChange={(val) => setFormularioTarea({ ...formularioTarea, descripcion: val })}
                    modules={{
                        toolbar: [
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
                            ['bold', 'italic', 'underline'],
                            ['clean']
                        ]
                    }}
                    placeholder="Escribe instrucciones o puntos a realizar..."
                    style={{ backgroundColor: 'white', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}
                />
                <label className="form-label fw-bold mt-3">📋 Adjuntar Planillas o Documentos (Opcional)</label>
                <div className="d-flex flex-column gap-2 border p-3 rounded bg-light">
                    {/* Archivos antiguos de DB */}
                    {listaViejos && listaViejos.length > 0 && listaViejos.map((arch, idx) => (
                         <div key={`old-${idx}`} className="d-flex align-items-center justify-content-between p-2 mb-1 border rounded bg-white shadow-sm">
                             <div className="d-flex align-items-center text-truncate pe-3">
                                <span className="me-2">📎</span>
                                <a href={`${URL_API.replace('/api', '')}/api/tareas/archivo/${arch}`} target="_blank" rel="noreferrer" className="text-secondary small fw-medium text-truncate">{arch}</a>
                             </div>
                             <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarArchivoViejo(idx)}>✖</button>
                         </div>
                    ))}
                    {/* Nuevos archivos listos para subir */}
                    {formularioTarea.archivosNuevosParaBD && formularioTarea.archivosNuevosParaBD.length > 0 && formularioTarea.archivosNuevosParaBD.map((f, idx) => (
                         <div key={`new-${idx}`} className="d-flex align-items-center justify-content-between p-2 mb-1 border rounded bg-white border-primary border-opacity-50 shadow-sm">
                             <div className="d-flex align-items-center text-truncate pe-3">
                                 <span className="me-2 px-1 rounded bg-success-subtle border-success text-success">NUEVO</span>
                                 <span className="text-dark small fw-medium text-truncate">{f.name}</span>
                             </div>
                             <button type="button" className="btn btn-sm border-0 text-danger" onClick={() => quitarArchivoNuevo(idx)}>Quitar</button>
                         </div>
                    ))}

                    <input 
                        type="file" 
                        multiple 
                        className="form-control form-control-sm text-secondary bg-white cursor-pointer" 
                        onChange={alSubirNuevosArchivos} 
                    />
                    <small className="text-muted d-block" style={{fontSize:'0.75rem'}}>Formatos recomendados: Excel (.xlsx), PDF, Word (.docx) o imágenes.</small>
                </div>

              </div>
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
