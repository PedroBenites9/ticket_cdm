# 🔧 Sistema de Gestión de Obras y Soporte Técnico

Una aplicación web Full-Stack diseñada para la gestión operativa y seguimiento de tareas en terreno. Optimizado para administrar instalaciones de seguridad (CCTV, alarmas, controles de acceso) y coordinar trabajos de terminaciones en obras de construcción.

## 🚀 Características Principales

- **Gestión Integral de Tickets (CRUD):** Creación, lectura, actualización y eliminación de incidencias y tareas.
- **Autenticación Segura:** Sistema de registro e inicio de sesión con contraseñas encriptadas (Bcrypt) y manejo de sesiones a través de JSON Web Tokens (JWT).
- **Dashboard Estadístico:** Visualización en tiempo real del estado global de las tareas (Total, Abiertos, En Proceso, Resueltos).
- **Filtros Dinámicos:** Categorización instantánea de tickets sin recarga de página (CCTV y Seguridad, Sistemas de Alarmas, Terminaciones, Hardware).
- **Interfaz Fluida:** Esqueletos de carga (Skeleton Loaders) para transiciones de datos y notificaciones flotantes (Toasts) para el feedback del usuario.

## 🛠️ Stack Tecnológico

**Front-End:**
- React (con Vite)
- Bootstrap 5 (Diseño Mobile-First)
- Framer Motion (Animaciones de UI)
- Sonner (Notificaciones Toast)

**Back-End:**
- Node.js & Express.js
- PostgreSQL (Base de datos relacional)
- node-postgres (`pg`)
- Bcrypt & JWT (Seguridad)
- CORS & Dotenv

## ⚙️ Instalación y Uso Local

Para correr este proyecto en tu entorno local, necesitas tener instalado [Node.js](https://nodejs.org/) y acceso a una base de datos PostgreSQL.

### 1. Configurar el Back-End (Servidor)

```bash
# Navegar a la carpeta del servidor
cd back-tickets

# Instalar las dependencias
npm install

# Iniciar el servidor en modo desarrollo
npm run dev