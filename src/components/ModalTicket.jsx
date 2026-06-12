import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ModalTicket = ({
  mostrarModal, setMostrarModal, editandoId, setEditandoId,
  formulario, manejarCambio, setFormulario, esSoloLectura,
  guardarTicket, ingresandoNuevoCliente, setIngresandoNuevoCliente,
  clientesLista, comentarios, nuevoComentario, setNuevoComentario,
  enviarComentario, rolUsuario, finalDelChatRef, descripcion, usuarioLogueado,
  listaUsuarios, archivosTicketNuevo, setArchivosTicketNuevo, URL_API,
  listaRoles 
}) => {
  if (!mostrarModal) return null;
  const miRol = parseInt(localStorage.getItem('rol_usuario'));
  const esAdmin = miRol === 1;

  // 📝 Parche de estilos para forzar que se vean los números y puntos en las listas (SÓLO EN LA VISTA DE BITÁCORA)
  const estilosParche = `
    .bitacora-view .ql-editor ol { padding-left: 0 !important; list-style-type: none; }
    .bitacora-view .ql-editor ul { padding-left: 0 !important; list-style-type: none; }
    .bitacora-view .ql-editor ol li, .bitacora-view .ql-editor ul li { padding-left: 1.5em !important; position: relative; }
    .bitacora-view .ql-editor ol li::before { 
      content: counter(ql-ol-counter) ". "; 
      counter-increment: ql-ol-counter; 
      position: absolute; left: 0; font-weight: bold; color: #0d6efd;
    }
    .bitacora-view .ql-editor ul li::before { 
      content: "•"; 
      position: absolute; left: 0; font-weight: bold; color: #0d6efd;
    }
    .bitacora-view .ql-editor { counter-reset: ql-ol-counter; }
  `;

  const nombreRolObj = listaRoles?.find(r => r.id === parseInt(rolUsuario));
  const esGuardia = nombreRolObj?.codigo === 'guardia';
  const [archivosBitacora, setArchivosBitacora] = useState([]);

  // Configuración del Toolbar (Estilo Gmail)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'link'
  ];

  const manejarPegadoNuevoTicket = (e) => {
    if (editandoId) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const nuevasImagenes = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            nuevasImagenes.push(new File([blob], `captura-inicial-${Date.now()}-${i}.png`, { type: blob.type }));
        }
    }
    
    if (nuevasImagenes.length > 0) {
        setArchivosTicketNuevo(prev => [...prev, ...nuevasImagenes]);
        e.preventDefault();
    }
  };

  const quitarArchivoNuevo = (indexToRemove) => {
    setArchivosTicketNuevo(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const manejarPegado = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const nuevasImagenes = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const file = new File([blob], `captura-${Date.now()}-${i}.png`, { type: blob.type });
        nuevasImagenes.push(file);
      }
    }
    
    if (nuevasImagenes.length > 0) {
      setArchivosBitacora(prev => [...prev, ...nuevasImagenes]);
      e.preventDefault();
    }
  };

  const quitarArchivo = (indexToRemove) => {
    setArchivosBitacora(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const manejarEnvioNota = async () => {
    // Si solo hay espacios o etiquetas vacías de Quill
    const textoLimpio = nuevoComentario.replace(/<(.|\n)*?>/g, '').trim();
    if (!textoLimpio && archivosBitacora.length === 0) return;

    const formData = new FormData();
    formData.append('autor', usuarioLogueado);
    formData.append('texto', nuevoComentario); // Enviamos el HTML tal cual
    
    archivosBitacora.forEach(archivo => {
        formData.append('archivos', archivo); 
    });

    try {
      const response = await fetch(`${URL_API}/tickets/${editandoId}/comentarios`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        setNuevoComentario('');
        setArchivosBitacora([]); 
      }
    } catch (error) {
      console.error("Error enviando nota:", error);
    }
  };

  const obtenerInfoArchivo = (ruta) => {
    const extension = ruta.split('.').pop().toLowerCase();
    const imagenes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (imagenes.includes(extension)) return { icono: '🖼️', color: 'btn-outline-info', tipo: 'img' };
    if (extension === 'pdf') return { icono: '📕', color: 'btn-outline-danger', tipo: 'doc' };
    return { icono: '📎', color: 'btn-outline-primary', tipo: 'doc' };
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <style>{estilosParche}</style>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '15px' }}>
          <div className="modal-header bg-white border-bottom-0 pt-4 px-4">
            <h5 className="modal-title fw-bold text-dark">
              {editandoId ? "🎫 Gestión de Ticket" : "📢 Nueva Incidencia Soporte IT"}
            </h5>
            <button type="button" className="btn-close" onClick={() => { setMostrarModal(false); setEditandoId(null); }}></button>
          </div>
          <div className="modal-body px-4">
            <form id="formTicket" onSubmit={guardarTicket}>
                <div className="mb-3">
                <label className="form-label fw-bold small text-muted uppercase ls-1">Asunto de la Incidencia</label>
                <input type="text" className="form-control border-light shadow-sm bg-light bg-opacity-50" name="asunto" value={formulario.asunto || ''} onChange={manejarCambio} required disabled={esSoloLectura} style={{ borderRadius: '10px' }} />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small text-muted uppercase ls-1">Solicitante</label>
                {esAdmin ? (
                  <select
                    className="form-select border-info shadow-sm"
                    name="solicitante"
                    value={formulario.solicitante || ''}
                    onChange={(e)=>manejarCambio(e)}
                    required
                    disabled={esSoloLectura}
                    style={{ borderRadius: '10px' }}
                  >
                    <option value="">Seleccione un usuario...</option>
                    {listaUsuarios?.map(user => (
                      <option key={user.id} value={user.nombre}>{user.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" className="form-control bg-light" value={formulario.solicitante || ''} disabled style={{ borderRadius: '10px' }} />
                )}
              </div>

              <div className="row">
                {!esGuardia && (
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold small text-muted">Origen</label>
                    <select className="form-select border-light shadow-sm" name="tipo_origen" value={formulario.tipo_origen || ''} onChange={manejarCambio} required disabled={esSoloLectura} style={{ borderRadius: '10px' }}>
                      <option value="Interno">🏢 Interno</option>
                      <option value="Externo">🤝 Externo</option>
                    </select>
                  </div>
                )}
                <div className={`col-md-${esGuardia ? '8' : '5'} mb-3`}>
                  <label className="form-label fw-bold small text-muted">Categoría IT</label>
                  <select className="form-select border-light shadow-sm" name="categoria" value={formulario.categoria || ''} onChange={manejarCambio} required disabled={esSoloLectura} style={{ borderRadius: '10px' }}>
                    <option value="" disabled>Seleccione...</option>
                    <option value="Redes e Internet">🌐 Redes e Internet</option>
                    <option value="Active Directory / Accesos">🔑 Active Directory / Accesos</option>
                    <option value="Hardware e Insumos">💻 Hardware e Insumos</option>
                    <option value="Software y SO">💽 Software y SO</option>
                    <option value="CCTV">📹 CCTV</option>
                    <option value="Reportes">📑 Reportes</option>
                    <option value="Mantenimiento">🛠️ Mantenimiento</option>
                    <option value="Programas/Aplicaciones">📱 Aplicaciones</option>
                  </select>
                </div>
                <div className={`col-md-${esGuardia ? '4' : '3'} mb-3`}>
                  <label className="form-label fw-bold small text-muted">Prioridad</label>
                  <select className="form-select border-light shadow-sm" name="prioridad" value={formulario.prioridad || ''} onChange={manejarCambio} disabled={esSoloLectura} style={{ borderRadius: '10px' }}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">🚨 Urgente</option>
                  </select>
                </div>
              </div>
              
              {formulario.tipo_origen === 'Externo' && (
                <div className="mb-3 animate__animated animate__fadeIn">
                  <label className="form-label fw-bold text-primary small">Cliente / Servicio</label>
                  {!ingresandoNuevoCliente ? (
                    <select className="form-select border-primary" name="cliente" value={formulario.cliente || ''} onChange={(e) => {
                        if (e.target.value === 'NUEVO_CLIENTE') { setIngresandoNuevoCliente(true); manejarCambio({ target: { name: 'cliente', value: '' } }); }
                        else { manejarCambio(e); }
                      }} required disabled={esSoloLectura}>
                      <option value="" disabled>Seleccione...</option>
                      {clientesLista.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                      <option value="NUEVO_CLIENTE" className="fw-bold text-success">➕ Nuevo cliente...</option>
                    </select>
                  ) : (
                    <div className="input-group">
                      <input type="text" className="form-control border-success" placeholder="Nombre cliente..." name="cliente" value={formulario.cliente || ''} onChange={(e) => setFormulario({ ...formulario, cliente: e.target.value.toUpperCase() })} required disabled={esSoloLectura} autoFocus />
                      <button className="btn btn-outline-danger" type="button" onClick={() => { setIngresandoNuevoCliente(false); manejarCambio({ target: { name: 'cliente', value: '' } }); }}>❌</button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted uppercase">Descripción del Problema</label>
                <textarea className="form-control border-light shadow-sm" rows="3" name="descripcion" value={formulario.descripcion || ''} onChange={manejarCambio} onPaste={manejarPegadoNuevoTicket} required disabled={editandoId && (usuarioLogueado !== formulario.solicitante)} style={{ borderRadius: '10px' }}></textarea>
              </div>

              {editandoId && formulario.archivo_adjunto && (() => {
                  let listaAdjuntos = [];
                  try { listaAdjuntos = JSON.parse(formulario.archivo_adjunto); } catch (e) { if (formulario.archivo_adjunto) listaAdjuntos = [formulario.archivo_adjunto]; }
                  if (listaAdjuntos.length === 0) return null;
                  return (
                      <div className="mb-4 bg-light p-3 rounded-4 border">
                          <label className="form-label fw-bold text-secondary mb-2 small">Archivos del Ticket Original:</label>
                          <div className="d-flex flex-wrap gap-2">
                              {listaAdjuntos.map((item, idx) => {
                                  const rutaReal = typeof item === 'object' ? item.ruta : item;
                                  const nombreMostrar = typeof item === 'object' ? item.nombreOriginal : rutaReal.split(/[/\\]/).pop();
                                  const info = obtenerInfoArchivo(rutaReal);
                                  const urlArch = `${URL_API}/tickets/archivo/${rutaReal.split(/[/\\]/).pop()}`;
                                  return info.tipo === 'img' ? (
                                      <a key={idx} href={urlArch} target="_blank" rel="noreferrer"><img src={urlArch} className="rounded border shadow-sm" style={{ height: '50px', width: '50px', objectFit: 'cover' }} /></a>
                                  ) : (
                                      <button key={idx} type="button" onClick={() => window.open(urlArch, '_blank')} className={`btn btn-sm ${info.color} py-1 shadow-sm`}>{info.icono} {nombreMostrar}</button>
                                  );
                              })}
                          </div>
                      </div>
                  );
              })()}

              {!editandoId && (
                  <div className="mb-4 bg-light p-3 rounded-4 border border-dashed border-secondary">
                      <input type="file" id="adjuntoNuevoTicket" className="d-none" multiple onChange={(e) => setArchivosTicketNuevo(prev => [...prev, ...Array.from(e.target.files)])} />
                      <label htmlFor="adjuntoNuevoTicket" className="btn btn-outline-secondary btn-sm mb-0 d-inline-flex align-items-center gap-2 shadow-sm cursor-pointer">📎 Adjuntar archivos</label>
                      {archivosTicketNuevo.length > 0 && (
                          <div className="mt-2 d-flex flex-wrap gap-2">
                              {archivosTicketNuevo.map((archivo, index) => (
                                  <div key={index} className="d-flex align-items-center gap-2 bg-white p-1 px-2 rounded shadow-sm border small">
                                      <span>📄 {archivo.name}</span>
                                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => quitarArchivoNuevo(index)}>✕</button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
            </form>

            {editandoId && (
              <div className="mt-4 pt-4 border-top">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold text-dark mb-0">💬 Bitácora de Soporte</h6>
                    <span className="badge bg-light text-muted fw-normal">{comentarios.length} notas</span>
                </div>
                
                <div className="bg-light p-3 rounded-4 mb-3 border shadow-inner" style={{ maxHeight: '350px', overflowY: 'auto', backgroundColor: '#fcfcfc' }}>
                  {comentarios.length > 0 ? (
                    comentarios.map((c) => {
                      return (
                        <div key={c.id} className="mb-4 bg-white p-3 rounded-4 shadow-sm border-0 animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>{c.autor}</span>
                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(c.fecha_creacion).toLocaleString()}</span>
                          </div>
                          
                          <div className="ql-container ql-snow border-0 bitacora-view">
                            <div 
                                className="text-dark ql-editor p-0" 
                                style={{ fontSize: '0.88rem', minHeight: 'auto', backgroundColor: 'transparent' }}
                                dangerouslySetInnerHTML={{ __html: c.mensaje }} 
                            />
                          </div>
                          
                          {c.archivo_adjunto && (() => {
                              let listaAdjuntos = [];
                              try { listaAdjuntos = JSON.parse(c.archivo_adjunto); } catch (e) { if (c.archivo_adjunto) listaAdjuntos = [c.archivo_adjunto]; }
                              return (
                                  <div className="d-flex flex-wrap gap-2 mt-3 pt-2 border-top">
                                      {listaAdjuntos.map((item, idx) => {
                                          const rutaReal = typeof item === 'object' ? item.ruta : item;
                                          const nombreMostrar = typeof item === 'object' ? item.nombreOriginal : rutaReal.split(/[/\\]/).pop();
                                          const info = obtenerInfoArchivo(rutaReal);
                                          const urlArch = `${URL_API}/tickets/archivo/${rutaReal.split(/[/\\]/).pop()}`;
                                          return info.tipo === 'img' ? (
                                              <a key={idx} href={urlArch} target="_blank" rel="noreferrer"><img src={urlArch} className="rounded border shadow-sm" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'cover' }} /></a>
                                          ) : (
                                              <button key={idx} onClick={() => window.open(urlArch, '_blank')} className={`btn btn-xs ${info.color} py-0 shadow-sm`} style={{fontSize: '0.65rem'}}>{info.icono} {nombreMostrar}</button>
                                          );
                                      })}
                                  </div>
                              );
                          })()}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-4"><p className="text-muted small fst-italic">No hay actividades registradas aún.</p></div>
                  )}
                  <div ref={finalDelChatRef} />
                </div>

                {!esSoloLectura && (
                  <div className="rounded-4 border p-3 bg-white shadow-sm">
                    <label className="form-label fw-bold small text-muted mb-2">Escribir Nota</label>
                    <div onPaste={manejarPegado}>
                        <ReactQuill 
                            theme="snow"
                            value={nuevoComentario}
                            onChange={setNuevoComentario}
                            modules={modules}
                            formats={formats}
                            placeholder="Describe el avance, agrega links o pega capturas..."
                            className="bg-white mb-3"
                            style={{ height: '120px', marginBottom: '45px' }}
                        />
                    </div>
                    
                    <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-5">
                       <div className="d-flex align-items-center gap-2">
                            <input type="file" id="fileBitacora" className="d-none" multiple onChange={(e) => setArchivosBitacora(prev => [...prev, ...Array.from(e.target.files)])} />
                            <label htmlFor="fileBitacora" className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }} title="Adjuntar archivos">📎</label>
                            
                            {archivosBitacora.length > 0 && <span className="badge bg-primary rounded-pill">{archivosBitacora.length} adjuntos</span>}
                       </div>
                       <button type="button" className="btn btn-primary px-4 fw-bold rounded-pill shadow-sm" onClick={manejarEnvioNota}>Enviar Nota</button>
                    </div>

                    {archivosBitacora.length > 0 && (
                      <div className="mt-3 flex-wrap d-flex gap-2 p-2 bg-light rounded-3 border border-dashed">
                        {archivosBitacora.map((archivo, index) => (
                          <div key={index} className="position-relative">
                            {archivo.type.includes('image') ? (
                              <img src={URL.createObjectURL(archivo)} className="rounded border shadow-xs" style={{ height: '50px', width: '50px', objectFit: 'cover' }} />
                            ) : (
                              <div className="p-2 bg-white border rounded small">📄 {archivo.name.substring(0,10)}...</div>
                            )}
                            <button className="btn btn-danger btn-xs position-absolute top-0 start-100 translate-middle rounded-circle p-0" style={{ width: '18px', height: '18px', fontSize: '10px' }} onClick={() => quitarArchivo(index)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer bg-light border-0 pb-4 px-4">
            <button type="button" className="btn btn-link text-muted text-decoration-none fw-bold me-auto" onClick={() => { setMostrarModal(false); setEditandoId(null); }}>Cerrar</button>
            <button type="submit" form="formTicket" className="btn btn-success px-4 fw-bold shadow-sm" style={{ borderRadius: '10px' }} disabled={esSoloLectura}>
              {editandoId ? "💾 Guardar Cambios" : "🚀 Generar Ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTicket;