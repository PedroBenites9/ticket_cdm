import React, { useState } from 'react';
import { toast } from 'sonner';
export const ModalUsuarios = ({ 
    mostrarModalUsuarios, setMostrarModalUsuarios, 
    rolUsuario, usuariosLista, areasDisponibles, listaRoles, cerrarModal, URL_API
}) => {

    // 1. Borrador para roles
    const [cambiosRolBorrador, setCambiosRolBorrador] = useState({});
    // 2. Borrador para áreas
    const [cambiosAreaBorrador, setCambiosAreaBorrador] = useState({});

    // 3. Función para guardar el área temporalmente
    const manejarCambioAreaSelect = (idUsuario, nuevoIdArea) => {
        setCambiosAreaBorrador({
            ...cambiosAreaBorrador,
            [idUsuario]: parseInt(nuevoIdArea)
        });
    };
    // 4. Función para guardar el rol temporalmente
    const manejarCambioRolSelect = (idUsuario, nuevoIdRol) => {
        setCambiosRolBorrador({
            ...cambiosRolBorrador,
            [idUsuario]: parseInt(nuevoIdRol)
        });
    };

    // 5. Envía todos los cambios juntos a la BD al apretar "Guardar"
    const handleGuardarCambios = async () => {
        try {
           // A. Promesas de Roles (Lo que ya tenías)
            const promesasRoles = Object.keys(cambiosRolBorrador).map(async (idUsuario) => {
                const nuevoIdRol = cambiosRolBorrador[idUsuario];
                const response = await fetch(`${URL_API}/usuarios/${idUsuario}/rol`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_rol: nuevoIdRol })
                });
                if (!response.ok) throw new Error("Fallo al actualizar rol");
            });

            // B. NUEVO: Promesas de Áreas
            const promesasAreas = Object.keys(cambiosAreaBorrador).map(async (idUsuario) => {
                const nuevoIdArea = cambiosAreaBorrador[idUsuario];
                // ⚠️ Asegurate de que esta ruta exista en tu Backend
                const response = await fetch(`${URL_API}/usuarios/${idUsuario}/area`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_area: nuevoIdArea })
                });
                if (!response.ok) {
                    const dataError = await response.json();
                    throw new Error(dataError.error || "Fallo al actualizar área");
                }
            });

            // C. Ejecutamos TODAS las promesas juntas (Roles y Áreas)
            await Promise.all([...promesasRoles, ...promesasAreas]);
            
            // Limpiamos AMBOS borradores
            setCambiosRolBorrador({});
            setCambiosAreaBorrador({});
            setMostrarModalUsuarios(false);
            toast.success("Todos los cambios se guardaron correctamente!");
          
        } catch (error) {
            console.error("Error al guardar:", error);
            toast.error(`No se pudieron guardar los cambios: ${error.message}`);
        }
    };
    

    // Si no debe mostrarse o no es admin, no renderiza nada
    if (!mostrarModalUsuarios || rolUsuario !== 'admin') return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content border-0 shadow-lg">
                    
                    {/* ENCABEZADO */}
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title fw-bold">👥 Gestión de Permisos</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setMostrarModalUsuarios(false)}></button>
                    </div>

                    {/* CUERPO DEL MODAL */}
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
                                        
                                        {/* Área Actual */}
                                        <td>
                                            <span className="badge bg-info text-dark">
                                                {u.nombre_area || 'Sin Área'}
                                            </span>
                                        </td>
                                        
                                        {/* Cambiar Área */}
                                        <td>
                                            <select 
                                                className="form-select form-select-sm shadow-sm cursor-pointer"
                                                value={cambiosAreaBorrador[u.id] || u.id_area || ''} 
                                                onChange={(e) => manejarCambioAreaSelect(u.id, e.target.value)}
                                                style={{ minWidth: '130px' }}
                                            >
                                                <option value="">Seleccionar área...</option>
                                                {areasDisponibles.map((areaDb) => (
                                                    <option key={areaDb.id} value={areaDb.id}>
                                                        {areaDb.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        
                                        {/* Rol Actual */}
                                        <td>
                                            <span className={`badge ${u.nombre_rol === 'Administrador' ? 'bg-danger' : 'bg-secondary'}`}>
                                                {u.nombre_rol ? u.nombre_rol.toUpperCase() : 'SIN ROL'}
                                            </span>
                                        </td>
                                        
                                        {/* Cambiar Rol (NUEVO SELECT CON BORRADOR) */}
                                        <td>
                                            <select 
                                                className="form-select form-select-sm shadow-sm cursor-pointer" 
                                                value={cambiosRolBorrador[u.id] || u.id_rol || ''} 
                                                onChange={(e) => manejarCambioRolSelect(u.id, e.target.value)}
                                                style={{ minWidth: '130px' }}
                                            >
                                                <option value="" disabled>Seleccionar rol...</option>
                                                {listaRoles.map((rolDb) => (
                                                    <option key={rolDb.id} value={rolDb.id}>
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

                    {/* PIE DEL MODAL (BOTONES) */}
                   <div className="modal-footer border-0">
                      <button 
                          type="button" 
                          className="btn btn-outline-secondary" 
                          onClick={cerrarModal}
                      >
                          Cerrar
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success px-4" 
                        onClick={handleGuardarCambios}
                        disabled={Object.keys(cambiosRolBorrador).length === 0 && Object.keys(cambiosAreaBorrador).length === 0}
                      >
                          Guardar cambios
                      </button>
                  </div>
                </div>
            </div>
        </div>
    );
};
export default ModalUsuarios;