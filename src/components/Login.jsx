import { useState } from 'react';
import { toast } from 'sonner';
import {motion} from 'framer-motion'; 

export default function Login({ cambiarVista, setUsuarioActual }) { 
  const [formulario, setFormulario] = useState({
    email: '',
    password: ''
  });

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const manejarIngreso = async (e) => {
    e.preventDefault();
    
    try {
      const respuesta = await fetch('https://back-tickets-u01r.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        // 1. Guardamos el Token JWT en la memoria del navegador
        localStorage.setItem('token_acceso', datos.token);
        localStorage.setItem('nombre_usuario', datos.usuario.nombre); // <-- NUEVO: Guardamos el nombre
        setUsuarioActual(datos.usuario.nombre);
        toast.success(`¡Bienvenido de nuevo, ${datos.usuario.nombre}!`);
        cambiarVista('main');
        
        // 2. Le pasamos el nombre real del usuario a App.jsx para que lo muestre arriba
        setUsuarioActual(datos.usuario.nombre);
        
        // 3. Lo dejamos pasar al panel principal
        cambiarVista('main');
      } else {
        // Si la contraseña o el correo están mal, mostramos el error
        toast.error(datos.error || "Credenciales incorrectas.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      toast.error("No se pudo conectar con el servidor.");
    }
  };
  
  return (
<motion.div className="container mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="row justify-content-center">
        <div className="col-md-4 text-center">
          <h2 className="mb-4">Iniciar Sesión</h2>
          <div className="card shadow-sm p-4">
            
            <form onSubmit={manejarIngreso}>
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
              
              <button type="submit" className="btn btn-primary w-100">
                Ingresar
              </button>
            </form>
            
            <p className="mt-3 mb-0">
              ¿No tienes cuenta?{' '}
              <a href="#" className="text-decoration-none" onClick={(e) => { 
                e.preventDefault(); 
                cambiarVista('register'); 
              }}>
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}