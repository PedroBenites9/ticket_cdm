import React, { useState } from 'react';

const ModalTicket = ({
  mostrarModal, setMostrarModal, editandoId, setEditandoId,
  formulario, manejarCambio, setFormulario, esSoloLectura,
  guardarTicket, ingresandoNuevoCliente, setIngresandoNuevoCliente,
  clientesLista, comentarios, nuevoComentario, setNuevoComentario,
  enviarComentario, rolUsuario, finalDelChatRef, descripcion, usuarioLogueado,
  listaUsuarios, archivosTicketNuevo, setArchivosTicketNuevo, URL_API,
  listaRoles // 👈 Recibimos la prop aquí
}) => {
  if (!mostrarModal) return null;
  const miRol = parseInt(localStorage.getItem('rol_usuario'));
  const esAdmin = miRol === 1;

  // 👇 LÓGICA PARA DETECTAR AL GUARDIA 👇
  const nombreRolObj = listaRoles?.find(r => r.id === parseInt(rolUsuario));
  const esGuardia = nombreRolObj?.codigo === 'guardia';
  // 1. Ahora el estado es un ARRAY vacío por defecto
  const [archivosBitacora, setArchivosBitacora] = useState([]);

  // 2. Nueva lógica de pegado para capturar varias imágenes
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

  // 3. Función para quitar un archivo específico de la lista antes de enviar
  const quitarArchivoNuevo = (indexToRemove) => {
    setArchivosTicketNuevo(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 2. Nueva lógica de pegado multi-imagen
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
      // Agregamos las nuevas imágenes a las que ya estaban
      setArchivosBitacora(prev => [...prev, ...nuevasImagenes]);
      e.preventDefault();
    }
  };

  // 3. Quitar un archivo específico de la lista antes de enviar
  const quitarArchivo = (indexToRemove) => {
    setArchivosBitacora(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 4. Envío de FormData múltiple
  const manejarEnvioNota = async () => {
    if (!nuevoComentario.trim() && archivosBitacora.length === 0) return;

    const formData = new FormData();
    formData.append('autor', usuarioLogueado);
    formData.append('texto', nuevoComentario);
    
    // Iteramos el array y appendeamos cada archivo con el MISMO nombre ('archivos')
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

  // Helper para íconos de archivos en el chat
  const obtenerInfoArchivo = (ruta) => {
    const extension = ruta.split('.').pop().toLowerCase();
    const imagenes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (imagenes.includes(extension)) return { icono: '🖼️', color: 'btn-outline-info', tipo: 'img' };
    if (extension === 'pdf') return { icono: '📕', color: 'btn-outline-danger', tipo: 'doc' };
    return { icono: '📎', color: 'btn-outline-primary', tipo: 'doc' };
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
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
                <input type="text" className="form-control" name="asunto" value={formulario.asunto || ''} onChange={manejarCambio} required disabled={esSoloLectura} />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Solicitante</label>
                {esAdmin ? (
                  <select
                    className="form-select border-info shadow-sm"
                    name="solicitante"
                    value={formulario.solicitante || ''}
                    onChange={(e)=>{
                      manejarCambio(e);
                    }}
                    required
                    disabled={esSoloLectura}
                  >
                    <option value="">Seleccione un usuario...</option>
                    {listaUsuarios?.map(user => (
                      <option key={user.id} value={user.nombre}>
                        {user.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formulario.solicitante || ''}
                    disabled
                  />
                )}
              </div>

              <div className="row">
                {!esGuardia && (
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Origen / Cliente</label>
                    <select className="form-select border-primary" name="tipo_origen" value={formulario.tipo_origen || ''} onChange={manejarCambio} required disabled={esSoloLectura}>
                      <option value="Interno">🏢 Personal Interno</option>
                      <option value="Externo">🤝 Cliente Externo</option>
                    </select>
                  </div>
                )}
                <div className={`col-md-${esGuardia ? '8' : '5'} mb-3`}>
                  <label className="form-label fw-bold">Categoría IT</label>
                  <select className="form-select" name="categoria" value={formulario.categoria || ''} onChange={manejarCambio} required disabled={esSoloLectura}>
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
                <div className={`col-md-${esGuardia ? '4' : '3'} mb-3`}>
                  <label className="form-label fw-bold">Prioridad</label>
                  <select className="form-select" name="prioridad" value={formulario.prioridad || ''} onChange={manejarCambio} disabled={esSoloLectura}>
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
                        if (e.target.value === 'NUEVO_CLIENTE') {
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
                        onChange={(e) => setFormulario({ ...formulario, cliente: e.target.value.toUpperCase() })}
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
                <label className="form-label fw-bold d-flex justify-content-between align-items-center">
                    Descripción detallada
                    {!editandoId && <span className="text-muted fw-normal" style={{fontSize: '0.8rem'}}>Podés pegar una captura (Ctrl+V)</span>}
                </label>
                <textarea 
                    className="form-control shadow-sm" 
                    rows="3" 
                    name="descripcion" 
                    value={formulario.descripcion || ''} 
                    onChange={manejarCambio} 
                    onPaste={manejarPegadoNuevoTicket} 
                    required 
                    disabled={editandoId && (usuarioLogueado !== formulario.solicitante)}
                ></textarea>
              </div>
              {editandoId && formulario.archivo_adjunto && (() => {
                  let listaAdjuntos = [];
                  try {
                      listaAdjuntos = JSON.parse(formulario.archivo_adjunto);
                  } catch (e) {
                      if (formulario.archivo_adjunto) listaAdjuntos = [formulario.archivo_adjunto];
                  }

                  if (listaAdjuntos.length === 0) return null;

                  return (
                      <div className="mb-4 bg-light p-2 rounded border">
                          <label className="form-label fw-bold text-secondary mb-2" style={{fontSize: '0.85rem'}}>
                              📎 Evidencias adjuntas al crear el ticket:
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                              {listaAdjuntos.map((item, idx) => {
                                  const esObjeto = typeof item === 'object' && item !== null;
                                  const rutaReal = esObjeto ? item.ruta : item;
                                  const nombreMostrar = esObjeto ? item.nombreOriginal : rutaReal.split(/[\/\\]/).pop();
                                  
                                  const info = obtenerInfoArchivo(rutaReal);
                                  const nombreArchServidor = rutaReal.split(/[\/\\]/).pop();
                                  const urlArch = `${URL_API}/tickets/archivo/${nombreArchServidor}`;

                                  return info.tipo === 'img' ? (
                                      <a key={idx} href={urlArch} target="_blank" rel="noreferrer" title={nombreMostrar}>
                                          <img 
                                            src={urlArch} 
                                            alt={nombreMostrar} 
                                            className="rounded border shadow-sm" 
                                            style={{ height: '50px', objectFit: 'cover' }} 
                                          />
                                      </a>
                                  ) : (
                                      <button 
                                        key={idx} 
                                        type="button" // 👈 Evita que envíe el formulario
                                        onClick={() => window.open(urlArch, '_blank')} 
                                        className={`btn btn-sm ${info.color} py-0 shadow-sm`}
                                        title={nombreMostrar}
                                      >
                                          {info.icono} {nombreMostrar}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  );
              })()}
              {!editandoId && (
                  <div className="mb-4 bg-light p-2 rounded border border-dashed">
                      <input 
                          type="file" 
                          id="adjuntoNuevoTicket" 
                          className="d-none" 
                          multiple 
                          onChange={(e) => setArchivosTicketNuevo(prev => [...prev, ...Array.from(e.target.files)])} 
                      />
                      <label htmlFor="adjuntoNuevoTicket" className="btn btn-outline-secondary btn-sm mb-0 d-inline-flex align-items-center gap-2 shadow-sm cursor-pointer">
                          📎 Adjuntar archivos
                      </label>
                      
                      {/* Vista Previa Múltiple */}
                      {archivosTicketNuevo.length > 0 && (
                          <div className="mt-2 d-flex flex-wrap gap-2">
                              {archivosTicketNuevo.map((archivo, index) => (
                                  <div key={index} className="d-flex align-items-center gap-2 bg-white p-2 rounded shadow-sm border">
                                      {archivo.type.includes('image') ? (
                                          <img 
                                              src={URL.createObjectURL(archivo)} 
                                              alt="Preview" 
                                              className="rounded" 
                                              style={{height: '40px', objectFit: 'cover'}} 
                                          />
                                      ) : (
                                          <span className="badge bg-secondary">📄 {archivo.name.split('.').pop().toUpperCase()}</span>
                                      )}
                                      <span className="text-truncate small fw-bold" style={{maxWidth: '150px'}}>{archivo.name}</span>
                                      <button type="button" className="btn btn-sm text-danger ms-auto p-0" onClick={() => quitarArchivoNuevo(index)} title="Quitar">
                                          ❌
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
            </form>

            {/* BITÁCORA ACTUALIZADA */}
            {editandoId && (
              <div className="mt-4 pt-4 border-top">
                <h6 className="fw-bold text-secondary mb-3">💬 Bitácora de Soporte</h6>
                <div className="bg-white p-3 rounded mb-3 border shadow-sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {comentarios.length > 0 ? (
                    comentarios.map((c) => {
                      const info = c.archivo_adjunto ? obtenerInfoArchivo(c.archivo_adjunto) : null;
                      const nombreArch = c.archivo_adjunto ? c.archivo_adjunto.split(/[\/\\]/).pop() : null;
                      const urlArch = c.archivo_adjunto ? `${URL_API}/tickets/archivo/${nombreArch}` : null;

                      return (
                        <div key={c.id} className="mb-3 pb-2 border-bottom">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-primary small">{c.autor}</span>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(c.fecha_creacion).toLocaleString()}</span>
                          </div>
                          <div className="text-dark small">{c.mensaje}</div>
                          
                          {c.archivo_adjunto && (() => {
                              let listaAdjuntos = [];
                              try {
                                  // Intentamos parsearlo como JSON (soporta array de strings viejos o array de objetos nuevos)
                                  listaAdjuntos = JSON.parse(c.archivo_adjunto);
                              } catch (e) {
                                  // Si falla totalmente, es porque era un string simple muy viejo
                                  if (c.archivo_adjunto) listaAdjuntos = [c.archivo_adjunto];
                              }

                              return (
                                  <div className="d-flex flex-wrap gap-2 mt-2">
                                      {listaAdjuntos.map((item, idx) => {
                                          // 1. Detectamos si es el formato NUEVO (objeto) o el VIEJO (string)
                                          const esObjeto = typeof item === 'object' && item !== null;
                                          
                                          // 2. Extraemos la ruta real para abrirlo y el nombre lindo para mostrarlo
                                          const rutaReal = esObjeto ? item.ruta : item;
                                          const nombreMostrar = esObjeto ? item.nombreOriginal : rutaReal.split(/[\/\\]/).pop();

                                          // 3. Preparamos los datos visuales
                                          const info = obtenerInfoArchivo(rutaReal);
                                          const nombreArchServidor = rutaReal.split(/[\/\\]/).pop();
                                          const urlArch = `${URL_API}/tickets/archivo/${nombreArchServidor}`;

                                          return info.tipo === 'img' ? (
                                              <a key={idx} href={urlArch} target="_blank" rel="noreferrer" title={nombreMostrar}>
                                                  <img 
                                                    src={urlArch} 
                                                    alt={nombreMostrar} 
                                                    className="rounded border shadow-sm" 
                                                    style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'cover' }} 
                                                  />
                                              </a>
                                          ) : (
                                              <button 
                                                key={idx} 
                                                onClick={() => window.open(urlArch, '_blank')} 
                                                className={`btn btn-xs ${info.color} py-0 shadow-sm`}
                                                title={nombreMostrar}
                                              >
                                                  {info.icono} {nombreMostrar}
                                              </button>
                                          );
                                      })}
                                  </div>
                              );
                          })()}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-muted small text-center mb-0 fst-italic">No hay notas registradas.</p>
                  )}
                  <div ref={finalDelChatRef} />
                </div>

                {/* INPUT DE ENVÍO CON COPY-PASTE Y CLIP */}
                {!esSoloLectura && (
                 <div className="d-flex flex-column gap-2 mt-3">
                    <div className="d-flex gap-2">
                      {/* Agregamos el atributo 'multiple' al input file */}
                      <input 
                        type="file" 
                        id="fileBitacora" 
                        className="d-none" 
                        multiple 
                        onChange={(e) => setArchivosBitacora(prev => [...prev, ...Array.from(e.target.files)])} 
                      />
                      <label htmlFor="fileBitacora" className="btn btn-outline-secondary mb-0 d-flex align-items-center">📎</label>
                      
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Nota o pega capturas (Ctrl+V)..." 
                        value={nuevoComentario} 
                        onChange={(e) => setNuevoComentario(e.target.value)} 
                        onPaste={manejarPegado}
                        onKeyDown={(e) => e.key === 'Enter' && manejarEnvioNota()} 
                      />
                      <button type="button" className="btn btn-primary btn-sm px-3" onClick={manejarEnvioNota}>Enviar</button>
                    </div>

                    {/* ZONA DE VISTA PREVIA MÚLTIPLE */}
                    {archivosBitacora.length > 0 && (
                      <div className="d-flex flex-wrap gap-3 p-2 bg-light border rounded">
                        {archivosBitacora.map((archivo, index) => (
                          <div key={index} className="position-relative d-inline-block">
                            {archivo.type.includes('image') ? (
                              <img src={URL.createObjectURL(archivo)} alt="preview" className="rounded border shadow-sm" style={{ height: '60px', objectFit: 'cover' }} />
                            ) : (
                              <span className="badge bg-info text-dark p-2 shadow-sm">📎 {archivo.name}</span>
                            )}
                            <span 
                                className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-circle shadow" 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => quitarArchivo(index)}
                            >
                                x
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer bg-light">
            <button type="submit" form="formTicket" className="btn btn-success" disabled={esSoloLectura}>
              {editandoId ? "Guardar Cambios" : "Generar Nuevo Ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTicket;