import { useState } from "react";

export default function Main({ cambiarVista }) {
  const [tickets, setTickets] = useState([
    {
      id: "TK-2041",
      asunto: "Impresora atascada",
      categoria: "Hardware",
      prioridad: "Media",
      estado: "En Proceso",
      fecha: "2024-05-20",
    },
    {
      id: "TK-2038",
      asunto: "Sin conexión al servidor",
      categoria: "Redes",
      prioridad: "Alta",
      estado: "Abierto",
      fecha: "2024-05-19",
    },
    {
      id: "TK-2015",
      asunto: "Cambio de mouse",
      categoria: "Hardware",
      prioridad: "Baja",
      estado: "Resuelto",
      fecha: "2024-05-15",
    },
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState({
    asunto: "",
    categoria: "",
    prioridad: "Baja",
    descripcion: "",
  });

  const obtenerColorEstado = (estado) => {
    if (estado === "Abierto") return "bg-danger";
    if (estado === "En Proceso") return "bg-warning text-dark";
    if (estado === "Resuelto") return "bg-success";
    return "bg-secondary";
  };

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const guardarTicket = (e) => {
    e.preventDefault();
    const nuevoTicket = {
      id: "TK-" + Math.floor(Math.random() * 9000 + 1000),
      asunto: formulario.asunto,
      categoria: formulario.categoria,
      prioridad: formulario.prioridad,
      estado: "Abierto",
      fecha: new Date().toISOString().split("T")[0],
    };
    setTickets([nuevoTicket, ...tickets]);
    setMostrarModal(false);
    setFormulario({
      asunto: "",
      categoria: "",
      prioridad: "Baja",
      descripcion: "",
    });
  };

  const cambiarEstadoTicket = (idTicket, nuevoEstado) => {
    const ticketsActualizados = tickets.map((ticket) => {
      if (ticket.id === idTicket) return { ...ticket, estado: nuevoEstado };
      return ticket;
    });
    setTickets(ticketsActualizados);
  };

  // 1. NUEVA FUNCIÓN: Lógica para eliminar un ticket
  const eliminarTicket = (idTicket) => {
    // window.confirm abre una ventanita nativa del navegador para confirmar
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar este ticket?",
    );

    if (confirmar) {
      // Usamos filter para guardar todos los tickets que NO tengan ese ID
      const ticketsRestantes = tickets.filter(
        (ticket) => ticket.id !== idTicket,
      );
      // Actualizamos el estado con la nueva lista
      setTickets(ticketsRestantes);
    }
  };

  const ticketsFiltrados = tickets.filter(
    (ticket) =>
      ticket.asunto.toLowerCase().includes(busqueda.toLowerCase()) ||
      ticket.id.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div>
      <header className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container">
          <span className="navbar-brand">
            <strong>🔧 Soporte Electrónica</strong>
          </span>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => cambiarVista("login")}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h3 text-secondary">Mis Incidencias</h2>
          <button
            className="btn btn-primary"
            onClick={() => setMostrarModal(true)}
          >
            + Nuevo Ticket
          </button>
        </div>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Buscar por ID o Asunto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table table-hover mb-0 text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Asunto</th>
                  <th>Categoría</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ticketsFiltrados.length > 0 ? (
                  ticketsFiltrados.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="fw-bold">{ticket.id}</td>
                      <td>{ticket.asunto}</td>
                      <td>{ticket.categoria}</td>
                      <td>{ticket.prioridad}</td>
                      <td>
                        <span
                          className={`badge ${obtenerColorEstado(ticket.estado)}`}
                        >
                          {ticket.estado}
                        </span>
                      </td>
                      <td>{ticket.fecha}</td>

                      {/* 2. NUEVO: Flexbox para alinear el select y el botón de borrar juntos */}
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <select
                            className="form-select form-select-sm"
                            style={{ width: "110px" }}
                            value={ticket.estado}
                            onChange={(e) =>
                              cambiarEstadoTicket(ticket.id, e.target.value)
                            }
                          >
                            <option value="Abierto">Abierto</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Resuelto">Resuelto</option>
                          </select>

                          {/* 3. NUEVO: Botón de eliminar apuntando a nuestra nueva función */}
                          <button
                            className="btn btn-danger btn-sm"
                            title="Eliminar Ticket"
                            onClick={() => eliminarTicket(ticket.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-muted py-3">
                      No se encontraron tickets con esa búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* EL MODAL DE CREAR TICKET (Queda igual) */}
      {mostrarModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reportar Incidencia</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarModal(false)}
                ></button>
              </div>

              <form onSubmit={guardarTicket}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Asunto breve</label>
                    <input
                      type="text"
                      className="form-control"
                      name="asunto"
                      value={formulario.asunto}
                      onChange={manejarCambio}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        name="categoria"
                        value={formulario.categoria}
                        onChange={manejarCambio}
                        required
                      >
                        <option value="" disabled>
                          Seleccione...
                        </option>
                        <option value="Hardware">Hardware</option>
                        <option value="Redes">Redes</option>
                        <option value="Software">Software</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prioridad</label>
                      <select
                        className="form-select"
                        name="prioridad"
                        value={formulario.prioridad}
                        onChange={manejarCambio}
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="descripcion"
                      value={formulario.descripcion}
                      onChange={manejarCambio}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setMostrarModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
