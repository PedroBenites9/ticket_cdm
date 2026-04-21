import React from 'react';

const ModalUsuarios = ({
  mostrarModalUsuarios, setMostrarModalUsuarios,
  rolUsuario, usuariosLista, cambiarRolUsuario,
  // 👇 ¡Agregamos estas dos nuevas props! 👇
  cambiarAreaUsuario, areasDisponibles
}) => {
  if (!mostrarModalUsuarios || rolUsuario !== 'admin') return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      {/* Usamos modal-xl para que sea un poquito más ancho y entren bien las columnas */}
      <div className="modal-dialog modal-xl"> 
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title fw-bold">👥 Gestión de Permisos</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setMostrarModalUsuarios(false)}></button>
          </div>
          <div className="modal-body p-0">
            <table className="table table-hover mb-0 text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  {/* Nuevas columnas de Área */}
                  <th>Área Actual</th>
                  <th>Cambiar Área</th>
                  {/* Columnas originales de Rol */}
                  <th>Rol Actual</th>
                  <th>Cambiar Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuariosLista.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-bold">{u.nombre}</td>
                    <td className="text-muted"><u>{u.email}</u></td>

                    {/* === NUEVA SECCIÓN: ÁREA === */}
                    <td><span className="badge bg-info text-dark">{u.area || 'Sin Área'}</span></td>
                    <td>
                      <select 
                        className="form-select form-select-sm mx-auto" 
                        style={{ width: '150px' }} 
                        value={u.area || ""} 
                        onChange={(e) => cambiarAreaUsuario(u.id, e.target.value)}
                      >
                        <option value="" disabled>Seleccionar...</option>
                        {/* Mapeamos las áreas (el && es por seguridad por si tarda en cargar) */}
                        {areasDisponibles && areasDisponibles.map(area => (
                          <option key={area.codigo} value={area.codigo}>{area.nombre}</option>
                        ))}
                      </select>
                    </td>

                    {/* === SECCIÓN ORIGINAL: ROL === */}
                    <td>
                      <span className={`badge ${u.rol === 'admin' ? 'bg-danger' : u.rol === 'tecnico' ? 'bg-primary' : 'bg-secondary'}`}>
                        {u.rol ? u.rol.toUpperCase() : ''}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-select form-select-sm mx-auto" 
                        style={{ width: '140px' }} 
                        value={u.rol} 
                        onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                      >
                        <option value="final">Usuario Final</option>
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={() => setMostrarModalUsuarios(false)}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalUsuarios;