import React, { useState } from 'react';

const ModalRecuperacion = ({ mostrar, setMostrar, URL_API }) => {
  const [paso, setPaso] = useState(1); // 1: Pedir Email | 2: Validar Código y Clave
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExtra, setMensajeExtra] = useState('');

  if (!mostrar) return null;

  const solicitarCodigo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensajeExtra('');
    try {
      // Usamos tu nueva ruta de auth.js
      const res = await fetch(`${URL_API}/auth/solicitar-recuperacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setPaso(2); // Avanzamos al paso 2
      setMensajeExtra('✅ Código enviado a tu correo. Revisa tu bandeja de entrada o SPAM.');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (nuevaPassword !== confirmarPassword) {
      return alert("Las contraseñas no coinciden");
    }
    setCargando(true);
    try {
      // Usamos tu ruta de cambio de password
      const res = await fetch(`${URL_API}/auth/cambiar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, nuevaPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      alert('🎉 ' + data.mensaje);
      cerrarModal(); // Cerramos y limpiamos
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const cerrarModal = () => {
    setMostrar(false);
    setPaso(1);
    setEmail('');
    setCodigo('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setMensajeExtra('');
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">🔐 Recuperar Contraseña</h5>
            <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
          </div>
          <div className="modal-body p-4">
            
            {paso === 1 ? (
              <form onSubmit={solicitarCodigo}>
                <p className="text-muted small mb-4">Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un código de 6 dígitos para verificar tu identidad.</p>
                <div className="mb-3">
                  <label className="form-label fw-bold">Correo Electrónico</label>
                  <input type="email" className="form-control" placeholder="ejemplo@cruzdemalta.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={cargando}>
                  {cargando ? "Enviando..." : "Enviar Código"}
                </button>
              </form>
            ) : (
              <form onSubmit={cambiarPassword}>
                {mensajeExtra && <div className="alert alert-success small py-2">{mensajeExtra}</div>}
                <div className="mb-3">
                  <label className="form-label fw-bold">Código de 6 dígitos</label>
                  <input type="text" className="form-control text-center fw-bold text-primary" placeholder="Ej: 123456" style={{ letterSpacing: '3px', fontSize: '1.2rem' }} maxLength="6" value={codigo} onChange={(e) => setCodigo(e.target.value)} required autoFocus />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Nueva Contraseña</label>
                  <input type="password" className="form-control" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required minLength="6" />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold">Confirmar Nueva Contraseña</label>
                  <input type="password" className="form-control" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required minLength="6" />
                </div>
                <button type="submit" className="btn btn-success w-100 fw-bold" disabled={cargando}>
                  {cargando ? "Verificando..." : "Restablecer Contraseña"}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRecuperacion;