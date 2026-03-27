import React from 'react';

const ModalTicket = ({ 
  mostrarModal, setMostrarModal, editandoId, setEditandoId, 
  formulario, manejarCambio, setFormulario, esSoloLectura, 
  guardarTicket, ingresandoNuevoCliente, setIngresandoNuevoCliente, 
  clientesLista, comentarios, nuevoComentario, setNuevoComentario, 
  enviarComentario, rolUsuario, finalDelChatRef 
}) => {
  if (!mostrarModal) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg"> 
        <div className="modal-content">
          <div className="modal-header bg-light">
            <h5 className="modal-title fw-bold text-secondary">
              {editandoId ? "Detalles y Bitácora del Ticket" : "Reportar Incidencia de Soporte IT"}
            </h5>
            <button type="button" className="btn-close" onClick={() => { setMostrarModal(false); setEditandoId(null); }}></button>
          </div>
          <div className="modal-body">
            <form id="formTicket" onSubmit={guardarTicket}>
              <div className="mb-3">
                <label className="form-label fw-bold">Asunto breve (Ej: PC sin internet)</label>
                <input type="text" className="form-control" name="asunto" value={formulario.asunto} onChange={manejarCambio} required disabled={esSoloLectura}/>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Origen / Cliente</label>
                  <select className="form-select border-primary" name="tipo_origen" value={formulario.tipo_origen} onChange={manejarCambio} required disabled={esSoloLectura}>
                    <option value="Interno">🏢 Personal Interno</option>
                    <option value="Externo">🤝 Cliente Externo</option>
                  </select>
                </div>
                <div className="col-md-5 mb-3">
                  <label className="form-label fw-bold">Categoría IT</label>
                  <select className="form-select" name="categoria" value={formulario.categoria} onChange={manejarCambio} required disabled={esSoloLectura}>
                    <option value="" disabled>Seleccione...</option>
                    <option value="Redes e Internet">🌐 Redes e Internet</option>
                    <option value="Active Directory / Accesos">🔑 Active Directory / Accesos</option>
                    <option value="Hardware e Insumos">💻 Hardware e Insumos</option>
                    <option value="Software y SO">💽 Software y Sistema Operativo</option>
                    <option value="CCTV">📹 CCTV</option>
                    <option value="Reportes">📑 Reportes</option>
                    <option value="Mantenimiento">🛠️ Mantenimiento</option>
                    <option value="Programas/Aplicaciones">📱 Programas/Aplicaciones</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-bold">Prioridad</label>
                  <select className="form-select" name="prioridad" value={formulario.prioridad} onChange={manejarCambio} disabled={esSoloLectura}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">🚨 Urgente</option>
                  </select>
                </div>
              </div>
              {formulario.tipo_origen === 'Externo' && (
                <div className="col-md-12 mb-3 animate__animated animate__fadeIn">
                  <label className="form-label fw-bold text-purple">🏢 Seleccione el Cliente / Servicio</label>
                  {!ingresandoNuevoCliente ? (
                    <select 
                      className="form-select border-purple" 
                      name="cliente"
                      value={formulario.cliente || ''} 
                      onChange={(e) => {
                        if(e.target.value === 'NUEVO_CLIENTE') {
                          setIngresandoNuevoCliente(true);
                          manejarCambio({ target: { name: 'cliente', value: '' } });
                        } else {
                          manejarCambio(e);
                        }
                      }}
                      required
                      disabled={esSoloLectura}
                    >
                      <option value="" disabled>Seleccione de la lista...</option>
                      {clientesLista.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                      <option value="NUEVO_CLIENTE" className="fw-bold text-success">➕ Agregar nuevo cliente...</option>
                    </select>
                  ) : (
                    <div className="input-group">
                      <input 
                        type="text" 
                        className="form-control border-success shadow-sm" 
                        placeholder="Nombre del nuevo cliente..."
                        name="cliente"
                        value={formulario.cliente || ''}
                        onChange={(e) => setFormulario({...formulario, cliente: e.target.value.toUpperCase()})}
                        required
                        disabled={esSoloLectura}
                        autoFocus
                      />
                      <button className="btn btn-outline-danger" type="button" onClick={() => { setIngresandoNuevoCliente(false); manejarCambio({ target: { name: 'cliente', value: '' } }); }}>❌</button>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-bold">Descripción detallada</label>
                <textarea className="form-control" rows="3" name="descripcion" value={formulario.descripcion} onChange={manejarCambio} required disabled={esSoloLectura}></textarea>
              </div>
            </form>
            {editandoId && (
              <div className="mt-4 pt-4 border-top">
                <h6 className="fw-bold text-secondary mb-3">💬 Bitácora de Soporte</h6>
                <div className="bg-light p-3 rounded mb-3 border" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {comentarios.length > 0 ? (
                    comentarios.map((c) => (
                      <div key={c.id} className="mb-3 pb-2 border-bottom">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-primary small">{c.autor}</span>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(c.fecha).toLocaleString()}</span>
                        </div>
                        <div className="text-dark small">{c.texto}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small text-center mb-0 fst-italic">No hay notas registradas.</p>
                  )}
                  <div ref={finalDelChatRef} />
                </div>
                <div className="d-flex gap-2">
                  <input type="text" className="form-control form-control-sm" placeholder="Nueva nota..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarComentario()} disabled={esSoloLectura}/>
                  <button type="button" className="btn btn-primary btn-sm px-4" onClick={enviarComentario} disabled={esSoloLectura}>Enviar</button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer bg-light" >
            <button type="button" className="btn btn-secondary" onClick={() => { setMostrarModal(false); setEditandoId(null); }}>Cerrar</button>              
            {(!editandoId || rolUsuario !== 'final') && (
              <button type="submit" form="formTicket" className="btn btn-success" disabled={esSoloLectura}>
                {editandoId ? "Guardar Cambios" : "Generar Nuevo Ticket"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTicket;
