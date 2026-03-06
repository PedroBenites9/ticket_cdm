# 🏢 Sistema de Gestión IT y Mantenimiento - Cruz de Malta

Un sistema integral (Full-Stack) diseñado específicamente para la **Cooperativa de Trabajo Cruz de Malta**. Esta plataforma unifica la gestión reactiva de incidencias técnicas (Helpdesk) con el control proactivo de rutinas de mantenimiento e instalaciones (Facility Management).

## 🚀 Introducción

Tradicionalmente, el soporte IT y el mantenimiento de infraestructura operan en silos. Este sistema resuelve ese problema ofreciendo un panel centralizado donde los coordinadores y técnicos pueden:
1. Reportar y solucionar problemas urgentes (Ej: Caídas de Red, Bloqueos de Active Directory, Fallas en CCTV).
2. Programar y auditar rutinas de prevención (Ej: Mantenimiento de servidores, limpieza, revisión de DVRs).
3. Tomar decisiones basadas en datos mediante Inteligencia de Negocios (BI) y exportación de métricas.

## ✨ Características Principales

* **🎫 Módulo de Soporte (Helpdesk):** Creación de tickets con asignación de técnicos, cálculo automático de Acuerdos de Nivel de Servicio (SLA) de 5 días, e historial inmutable en modo lectura tras el cierre.
* **🔄 Mantenimiento Preventivo:** Programación de tareas diarias que, al completarse, se reprograman automáticamente para el día siguiente y registran al usuario responsable.
* **📊 Business Intelligence (BI):** Dashboards en tiempo real con gráficos interactivos y exportación de bitácoras históricas a Excel (.xlsx) para auditorías de rendimiento.
* **📱 Aplicación Progresiva (PWA):** Instalable como aplicación nativa en dispositivos móviles (Android/iOS) para técnicos en terreno.
* **🔐 Seguridad y Roles:** Control de acceso segmentado (Administrador, Técnico, Usuario Final).

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React.js, Vite, Bootstrap (UI), Recharts (Gráficos), SheetJS (Exportación a Excel), Vite PWA.
* **Backend:** Node.js, Express, CORS.
* **Base de Datos:** PostgreSQL (Alojado en Neon.tech).
* **Despliegue (Deploy):** Render (Backend) y Netlify/Vercel (Frontend).

---

## ⚙️ Pasos para la Instalación Local

Si deseas correr este proyecto en tu propia computadora para desarrollo, sigue estos pasos:

### 1. Prerrequisitos
* Tener instalado [Node.js](https://nodejs.org/).
* Tener una cuenta en [Neon.tech](https://neon.tech/) para la base de datos PostgreSQL.

### 2. Configuración de la Base de Datos (PostgreSQL)
Abre el panel SQL de tu base de datos y ejecuta los siguientes scripts para crear las tablas necesarias:

```sql
-- Tabla de Tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  tipo_origen VARCHAR(20) DEFAULT 'Interno',
  estado VARCHAR(30) DEFAULT 'Abierto',
  tecnico_asignado VARCHAR(100),
  fecha_finalizado TIMESTAMP NULL
);

-- Tabla de Tareas Diarias
CREATE TABLE tareas_diarias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  frecuencia VARCHAR(20) DEFAULT 'Diaria',
  hora_programada TIME NOT NULL,
  proxima_ejecucion TIMESTAMP NOT NULL,
  estado VARCHAR(20) DEFAULT 'Pendiente',
  ultima_vez_completada TIMESTAMP NULL
);

-- Tabla de Historial (Métricas)
CREATE TABLE historial_tareas (
  id SERIAL PRIMARY KEY,
  tarea_id INT NOT NULL,
  titulo_tarea VARCHAR(150) NOT NULL,
  usuario_que_completo VARCHAR(100) NOT NULL,
  fecha_completada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);