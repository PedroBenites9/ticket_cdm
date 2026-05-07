import React from 'react';

const ModalUsuarios = ({
  mostrarModalUsuarios, setMostrarModalUsuarios,
  rolUsuario, usuariosLista, cambiarRolUsuario,
  cambiarAreaUsuario, areasDisponibles,listaRoles
}) => {
  if (!mostrarModalUsuarios || rolUsuario !== 'admin') return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
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
                  <th>Área Actual</th>
                  <th>Cambiar Área</th>
                  <th>Rol Actual</th>
                  <th>Cambiar Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuariosLista.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-bold">{u.nombre}</td>
                    <td className="text-muted"><u>{u.email}</u></td>
                    <td>
                      <span className="badge bg-info text-dark">
                          {u.nombre_area || 'Sin Área'}
                      </span></td>
                    <td>
                      <select 
                        className="form-select form-select-sm mx-auto" 
                        style={{ width: '150px' }} 
                        value={u.area || ""} 
                        onChange={(e) => cambiarAreaUsuario(u.id, e.target.value)}
                      >
                        <option value="" disabled>Seleccionar...</option>
                        {areasDisponibles && areasDisponibles.map(area => (
                          <option key={area.codigo} value={area.codigo}>{area.nombre}</option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <span className={`badge ${u.nombre_rol === 'Administrador' ? 'bg-danger' : 'bg-secondary'}`}>
                          {u.nombre_rol ? u.nombre_rol.toUpperCase() : 'SIN ROL'}
                      </span>
                    </td>
                    <td>
                      <select 
                          className="form-select form-select-sm shadow-sm cursor-pointer" 
                          value={u.rol?.toLowerCase()} 
                          onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                          style={{ minWidth: '130px' }}
                      >
                          <option value="" disabled>Seleccionar rol...</option>
                          {/* Iteramos sobre listaRoles, NO sobre usuariosLista */}
                          {listaRoles.map((rolDb) => (
                              <option 
                                  key={rolDb.id} 
                                  value={rolDb.codigo} 
                              >
                                  {rolDb.nombre} 
                              </option>
                          ))}
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