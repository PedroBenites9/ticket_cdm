// src/components/Register.jsx

export default function Register({ cambiarVista }) {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4 text-center">
          <h2 className="mb-4">Crear Cuenta</h2>

          <div className="card shadow-sm p-4">
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Nombre completo"
            />
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Correo"
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Contraseña"
            />

            {/* Al hacer clic en Registrarme, simulamos que vuelve al Login */}
            <button
              className="btn btn-success w-100"
              onClick={() => cambiarVista("login")}
            >
              Registrarme
            </button>

            <p className="mt-3 mb-0">
              ¿Ya tienes cuenta?{" "}
              <a
                href="#"
                className="text-decoration-none"
                onClick={(e) => {
                  e.preventDefault();
                  cambiarVista("login");
                }}
              >
                Vuelve al Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
