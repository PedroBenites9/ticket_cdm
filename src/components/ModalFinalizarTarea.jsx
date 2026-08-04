import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModalFinalizarTarea = ({ 
  mostrar, 
  setMostrar, 
  tarea, 
  marcarTareaCompletada ,
  usuariosLista,   
  rolUsuario,      
  usuarioLogueado,
  URL_API
}) => {
  const [comentario, setComentario] = useState('');
  const [archivosNuevos, setArchivosNuevos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [tecnicoRealizador, setTecnicoRealizador] = useState('');
  const [archivosAMantener, setArchivosAMantener] = useState([]);

  useEffect(() => {
    if (mostrar && tarea) {
        setTecnicoRealizador(tarea?.usuario_asignado || usuarioLogueado);
        setComentario('');
        setArchivosNuevos([]);
        setArchivosAMantener([]);

        const buscarHistorialHoy = async () => {
            try {
                const res = await fetch(`${URL_API}/tareas/historial/${tarea.id}`);
                if (!res.ok) return;
                const historial = await res.json();
                
                if (historial && historial.length > 0) {
                    const ultimo = historial[0];
                    const fechaUltimo = new Date(ultimo.fecha_completada).toLocaleDateString();
                    const hoy = new Date().toLocaleDateString();

                    // 📆 Solo precargamos si se finalizó HOY (el blanqueo es automático al día siguiente)
                    if (fechaUltimo === hoy) {
                        setComentario(ultimo.comentario || '');
                        if (ultimo.archivo_adjunto) {
                            try {
                                const parsed = JSON.parse(ultimo.archivo_adjunto);
                                setArchivosAMantener(Array.isArray(parsed) ? parsed : [parsed]);
                            } catch (e) {
                                setArchivosAMantener([ultimo.archivo_adjunto]);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error al recuperar historial:", err);
            }
        };

        buscarHistorialHoy();
    }
  }, [mostrar, usuarioLogueado, tarea, URL_API]);

  if (!tarea) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    const formData = new FormData();
    formData.append('comentario', comentario);
    formData.append('usuario', tecnicoRealizador);
    
    // Enviamos la lista de archivos que queremos CONSERVAR
    formData.append('archivosViejos', JSON.stringify(archivosAMantener));
    
    // Enviamos los archivos físicos NUEVOS
    archivosNuevos.forEach(file => {
      formData.append('archivos', file);
    });

    try {
      await marcarTareaCompletada(tarea.id, formData);
      setMostrar(false);
    } catch (error) {
      console.error("Error al finalizar tarea:", error);
    } finally {
      setEnviando(false);
    }
  };

  const quitarArchivoNuevo = (index) => {
    setArchivosNuevos(archivosNuevos.filter((_, i) => i !== index));
  };

  const quitarArchivoViejo = (index) => {
    setArchivosAMantener(archivosAMantener.filter((_, i) => i !== index));
  };

 return (
    <AnimatePresence>
      {mostrar && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-dialog modal-dialog-centered modal-md"
          >
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header bg-success text-white py-3 border-0 shadow-sm">
                <h5 className="modal-title fw-bold d-flex align-items-center">
                   <span className="me-2">✅</span> Finalizar / Reportar Rutina
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setMostrar(false)}></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4 bg-light">
                  <div className="bg-white p-3 rounded-4 shadow-sm mb-4">
                    <p className="text-muted small mb-1 ls-1 fw-bold uppercase">Nombre de la Tarea</p>
                    <h5 className="fw-bold text-dark mb-0">{tarea.titulo}</h5>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small d-flex justify-content-between">
                        <span>¿Qué se realizó?</span>
                    </label>
                    <textarea 
                      className="form-control border-0 shadow-sm focus-ring" 
                      rows="4" 
                      placeholder="Escribe aquí los detalles del trabajo..."
                      value={comentario}
                      style={{ borderRadius: '12px', resize: 'none' }}
                      onChange={(e) => setComentario(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small">Adjuntar Evidencias (Fotos, PDF, etc)</label>
                    <div className="input-group mb-2">
                        <input 
                          type="file" 
                          id="fileInput"
                          className="d-none" 
                          multiple 
                          onChange={(e) => setArchivosNuevos([...archivosNuevos, ...Array.from(e.target.files)])}
                        />
                        <button 
                            type="button" 
                            className="btn btn-outline-success w-100 py-2 fw-bold" 
                            style={{ borderStyle: 'dashed', borderWidth: '2px', borderRadius: '12px' }}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            ➕ Agregar archivos
                        </button>
                    </div>
                    
                    {/* Lista de Archivos NUEVOS */}
                    {archivosNuevos.length > 0 && (
                      <div className="mb-3">
                        <small className="text-success fw-bold d-block mb-2">Archivos nuevos a subir:</small>
                        <div className="d-flex flex-column gap-2">
                          {archivosNuevos.map((f, idx) => (
                            <div key={idx} className="d-flex align-items-center justify-content-between bg-white p-2 rounded-3 border border-success-subtle shadow-xs">
                              <span className="small text-truncate w-75">📄 {f.name}</span>
                              <button type="button" className="btn btn-sm btn-danger rounded-circle p-1" style={{width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => quitarArchivoNuevo(idx)}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista de Archivos VIEJOS */}
                    {archivosAMantener.length > 0 && (
                        <div className="mt-3">
                            <small className="text-info d-block fw-bold mb-2">💾 Archivos cargados hoy (Se mantendrán):</small>
                            <div className="d-flex flex-column gap-2">
                                {archivosAMantener.map((ruta, idx) => {
                                    const nombreArchivo = ruta.split(/[/\\]/).pop();
                                    return (
                                        <div key={idx} className="d-flex align-items-center justify-content-between bg-info bg-opacity-10 p-2 rounded-3 border border-info border-opacity-25">
                                            <a 
                                                href={`${URL_API}/tareas/archivo/${nombreArchivo}?name=${encodeURIComponent(tarea?.titulo || 'Tarea')}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="small text-info text-truncate w-75 text-decoration-none"
                                            >
                                                📂 {nombreArchivo}
                                            </a>
                                            <button type="button" className="btn btn-sm btn-danger rounded-circle p-1" style={{width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => quitarArchivoViejo(idx)}>✕</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0 p-4 bg-white">
                  <button type="button" className="btn btn-light fw-bold text-muted px-4 rounded-pill me-auto" onClick={() => setMostrar(false)}>Cancelar</button>
                  <button 
                    type="submit" 
                    className="btn btn-success fw-bold px-5 rounded-pill shadow-lg hover-scale"
                    disabled={enviando}
                  >
                    {enviando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalFinalizarTarea;
