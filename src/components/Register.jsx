import { useState } from 'react';
import { toast } from 'sonner';

export default function Register({ cambiarVista }) {
  // 1. Estado para guardar los datos del formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    password: ''
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

    try {
      const respuesta = await fetch('https://back-tickets-u01r.onrender.com/api/usuarios', {
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
    </div>
  )
}