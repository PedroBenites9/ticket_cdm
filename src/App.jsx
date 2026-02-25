import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Main from "./components/Main";

export default function App() {
  // Estado inicial: empezamos en la pantalla de 'login'
  const [vistaActual, setVistaActual] = useState("login");

  return (
    <div>
      {/* Condicionales de React: Si la vistaActual es 'X', mostramos el componente <X /> */}

      {vistaActual === "login" && <Login cambiarVista={setVistaActual} />}

      {vistaActual === "register" && <Register cambiarVista={setVistaActual} />}

      {vistaActual === "main" && <Main cambiarVista={setVistaActual} />}
      {console.log(vistaActual)}
    </div>
  );
}
