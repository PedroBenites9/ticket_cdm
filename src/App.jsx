import { useState } from 'react'
import { Toaster } from 'sonner'
import Login from './components/Login'
import Register from './components/Register'
import Main from './components/Main'

export default function App() {
  // Revisa si hay token. Si hay, va a 'main', si no, a 'login'
  const [vistaActual, setVistaActual] = useState(() => {
    return localStorage.getItem('token_acceso') ? 'main' : 'login';
  });
  
  // Revisa si hay un nombre guardado. Si no, arranca vacío
  const [usuarioActual, setUsuarioActual] = useState(() => {
    return localStorage.getItem('nombre_usuario') || '';
  }); 

  return (
    <div>
      <Toaster richColors position="top-right" />

      {vistaActual === 'login' && (
        <Login cambiarVista={setVistaActual} setUsuarioActual={setUsuarioActual} />
      )}

      {vistaActual === 'register' && (
        <Register cambiarVista={setVistaActual} />
      )}

      {vistaActual === 'main' && (
        <Main cambiarVista={setVistaActual} usuario={usuarioActual} />
      )}
    </div>
  )
}