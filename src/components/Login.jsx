// src/components/Login.jsx

// 1. Recibimos la función 'cambiarVista' entre llaves
export default function Login({ cambiarVista }) {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4 text-center">
          <h2 className="mb-4">Iniciar Sesión</h2>

          <div className="card shadow-sm p-4">
            {/* Nota: En React usamos className en lugar de class */}
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Correo electrónico"
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Contraseña"
            />

            {/* 2. Al hacer clic, ejecutamos la función para ir a 'main' */}
            <button
              className="btn btn-primary w-100"
              onClick={() => cambiarVista("main")}
            >
              Ingresar
            </button>

            <p className="mt-3 mb-0">
              ¿No tienes cuenta?{" "}
              {/* 3. Al hacer clic, ejecutamos la función para ir a 'register' */}
              <a
                href="#"
                className="text-decoration-none"
                onClick={(e) => {
                  e.preventDefault(); // Esto evita que el enlace recargue la página
                  cambiarVista("register");
                }}
              >
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
