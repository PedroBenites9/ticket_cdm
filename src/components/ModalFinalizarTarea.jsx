import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ModalFinalizarTarea = ({ 
  mostrar, 
  setMostrar, 
  tarea, 
  marcarTareaCompletada 
}) => {
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!tarea) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    const formData = new FormData();
    formData.append('comentario', comentario);
    if (archivo) {
      formData.append('archivo', archivo);
    }


    try {
      await marcarTareaCompletada(tarea.id, formData);
      setComentario('');
      setArchivo(null);
      setMostrar(false);
    } catch (error) {
      console.error("Error al finalizar tarea:", error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AnimatePresence>
      {mostrar && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="modal-dialog modal-dialog-centered"
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">✅ Finalizar Rutina</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setMostrar(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <p className="text-secondary small mb-2">Estás por completar: <strong className="text-dark">{tarea.titulo}</strong></p>
                    <label className="form-label fw-bold small text-muted">¿Qué se realizó? (Opcional)</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Describe brevemente las acciones realizadas..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Adjuntar Evidencia (Foto, PDF, Excel...)</label>
                    <div className="input-group">
                      <input 
                        type="file" 
                        className="form-control" 
                        onChange={(e) => setArchivo(e.target.files[0])}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      />
                    </div>
                    <div className="form-text mt-1" style={{fontSize: '0.75rem'}}>
                       Máximo 10MB. Formatos permitidos: Imágenes y Documentos.
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrar(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-success px-4 fw-bold shadow-sm" disabled={enviando}>
                    {enviando ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</>
                    ) : 'Confirmar Finalización'}
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
