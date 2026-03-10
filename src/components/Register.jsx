import { useState } from 'react';
import { toast } from 'sonner';
import { useCarga } from '../../hooks/useCarga'; 

export default function Register({ cambiarVista }) {
  const { mostrarCarga, ocultarCarga, VistaCarga } = useCarga();
  // 1. Estado para guardar los datos del formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    password: '',
    area: ''
  });

  // 2. Función para actualizar el estado mientras el usuario escribe
  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  // 3. Función que envía los datos al Backend al hacer clic en "Registrarme"
  const manejarRegistro = async (e) => {
    e.preventDefault();
    mostrarCarga();
    try {
      const respuesta = await fetch('https://back-tickets-u01r.onrender.com/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });

      const datos = await respuesta.json();
      
      if (respuesta.ok) {
        toast.success("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
        cambiarVista('login'); // Lo enviamos al login automáticamente
      } else {
        // Si el correo ya existe o hay otro error, mostramos el mensaje del backend
        toast.error(datos.error || "Hubo un error al registrar el usuario.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      // ESTO ASEGURA QUE LA PANTALLA DE CARGA SE QUITE
      ocultarCarga();
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4 text-center">
          <h2 className="mb-4">Crear Cuenta</h2>
          <div className="card shadow-sm p-4">
            
            <form onSubmit={manejarRegistro}>
              <input 
                type="text" 
                className="form-control mb-3" 
                name="nombre"
                placeholder="Nombre completo" 
                value={formulario.nombre}
                onChange={manejarCambio}
                required
              />
              <input 
                type="email" 
                className="form-control mb-3" 
                name="email"
                placeholder="Correo electrónico" 
                value={formulario.email}
                onChange={manejarCambio}
                required
              />
              <input 
                type="password" 
                className="form-control mb-3" 
                name="password"
                placeholder="Contraseña" 
                value={formulario.password}
                onChange={manejarCambio}
                required
              />
              {/* NUEVO: Selector de Áreas */}
              <select 
                className="form-select mb-3 border-secondary" 
                name="area"
                value={formulario.area}
                onChange={manejarCambio}
                required
              >
                <option value="" disabled>Seleccione su Área...</option>
                <option value="Tesoreria">Tesorería</option>
                <option value="Sindico">Síndico</option>
                <option value="Operaciones">Operaciones</option>
                <option value="Comercial">Comercial</option>
                <option value="Logistica">Logística</option>
                <option value="RRHH">RRHH</option>
                <option value="Incorporaciones">Incorporaciones</option>
                <option value="Habilitaciones">Habilitaciones</option>
                <option value="Tecnologia">Tecnología (IT)</option>
              </select>
              
              <button type="submit" className="btn btn-success w-100">
                Registrarme
              </button>
            </form>
            
            <p className="mt-3 mb-0">
              ¿Ya tienes cuenta?{' '}
              <a href="#" className="text-decoration-none" onClick={(e) => {
                  e.preventDefault();
                  cambiarVista('login');
              }}>
                Vuelve al Login
              </a>
            </p>
          </div>
        </div>
      </div>
      {VistaCarga}
    </div>
  )
}