import { useState } from 'react';

export const useCarga = () => {
  const [procesando, setProcesando] = useState(false);

  // Funciones para encender y apagar
  const mostrarCarga = () => setProcesando(true);
  const ocultarCarga = () => setProcesando(false);

  // El diseño visual empaquetado y listo para usarse
  const VistaCarga = procesando ? (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div className="spinner-border text-light" style={{ width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <h5 className="text-light mt-3 fw-bold animate__animated animate__pulse animate__infinite">
        Procesando solicitud...
      </h5>
    </div>
  ) : null;

  // Devolvemos las herramientas para que cualquier componente las use
  return { mostrarCarga, ocultarCarga, VistaCarga };
};