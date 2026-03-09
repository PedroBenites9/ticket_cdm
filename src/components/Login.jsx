import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import { useCarga } from '../../hooks/useCarga'; 

export default function Login({ cambiarVista, setUsuarioActual }) {
  const { mostrarCarga, ocultarCarga, VistaCarga } = useCarga();
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
    mostrarCarga();
    try {
      // Usamos la URL de producción de Render
      const respuesta = await fetch('https://back-tickets-u01r.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });

      const datos = await respuesta.json();

   if (respuesta.ok) {
        localStorage.setItem('token_acceso', datos.token);
        localStorage.setItem('nombre_usuario', datos.usuario.nombre);
        
        // ---> NUEVO: Guardamos el rol en la memoria del navegador
        localStorage.setItem('rol_usuario', datos.usuario.rol); 
        
        setUsuarioActual(datos.usuario.nombre);
        toast.success(`¡Bienvenido de nuevo, ${datos.usuario.nombre}!`);
        cambiarVista('main');
      } else {
        toast.error(datos.error || "Credenciales incorrectas.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      toast.error("No se pudo conectar con el servidor.");
    }finally{
      ocultarCarga();
    }
  };

  // ==========================================
  // NUEVO DISEÑO CON FONDO Y LOGO
  // ==========================================
  return (
    // 1. Contenedor principal que ocupa toda la pantalla y tiene el fondo degradado
    <div style={{ 
      minHeight: '100vh', // Asegura que ocupe el 100% del alto de la pantalla
      width: '100%',
      // Un degradado profesional de azul marino oscuro a un tono un poco más claro
      background: 'linear-gradient(360deg, #0a192f 0%, #1353acff 100%)',
      display: 'flex',
      alignItems: 'center', // Centra verticalmente el contenido
      justifyContent: 'center' // Centra horizontalmente
    }}>
      
      {/* Tu componente animado original (le quitamos el mt-5 porque ya lo centramos con flexbox arriba) */}
      <motion.div 
        className="container" 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="row justify-content-center">
          <div className="col-md-4 text-center">
            
            {/* Tarjeta blanca del formulario */}
            <div className="card shadow-lg p-4 border-0 rounded-3">
               {/* 2. NUEVO: La Imagen del Logo Centrada */}
              <img 
                src={logo} 
                alt="Logo de la empresa" 
                className="d-block mx-auto mb-4 img-fluid" // Clases Bootstrap para centrar
                style={{ maxWidth: '320px', height: 'auto' }} // Controla que no sea gigante
              />
             

              <h2 className="mb-4 fw-bold text-dark">Iniciar Sesión</h2>
              
              <form onSubmit={manejarIngreso}>
                <div className="form-floating mb-3">
                  <input 
                    type="email" 
                    className="form-control" 
                    id="floatingEmail"
                    name="email"
                    placeholder="name@example.com" 
                    value={formulario.email}
                    onChange={manejarCambio}
                    required
                  />
                  <label htmlFor="floatingEmail" className="text-muted">Correo electrónico</label>
                </div>

                <div className="form-floating mb-3">
                   <input 
                    type="password" 
                    className="form-control" 
                    id="floatingPassword"
                    name="password"
                    placeholder="Contraseña" 
                    value={formulario.password}
                    onChange={manejarCambio}
                    required
                  />
                  <label htmlFor="floatingPassword" className="text-muted">Contraseña</label>
                </div>
                
                <button type="submit" className="btn btn-primary w-100 btn-lg py-2 fw-bold shadow-sm">
                  Ingresar
                </button>
              </form>
              
              <p className="mt-4 mb-0 text-muted">
                ¿No tienes cuenta?{' '}
                <a href="#" className="text-primary fw-bold text-decoration-none" onClick={(e) => { 
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
        {VistaCarga}
    </div>
  )
}