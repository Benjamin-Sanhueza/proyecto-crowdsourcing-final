# 🎓 Crowdsourcing Ciudadano Universitario

![Status](https://img.shields.io/badge/Status-Finalizado-success)
![University](https://img.shields.io/badge/Universidad-San_Sebastián-blue)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED)
![License](https://img.shields.io/badge/License-MIT-green)

**Plataforma integral de reporte y gestión de incidencias de infraestructura.**
*Facultad de Ingeniería y Tecnología - Taller de Software 2025*

---

## 🔗 Enlaces de Producción (Live Demo)

El sistema se encuentra desplegado y operativo en la nube:

* **💻 Panel de Administración Web:** [https://proyecto-crowdsourcing-final.vercel.app](https://proyecto-crowdsourcing-final.vercel.app)
    * *Credenciales Demo:* `admin@test.com` / `12345`
* **⚙️ Backend API:** [https://proyecto-crowdsourcing-final.onrender.com](https://proyecto-crowdsourcing-final.onrender.com)
* **📱 App Móvil:** Disponible vía APK (generado con EAS Build).

---

## 📖 Descripción del Proyecto

El proyecto **Crowdsourcing Ciudadano Universitario** nace para solucionar la dispersión en la gestión de problemas de infraestructura (iluminación, mobiliario, higiene, etc.) dentro del campus.

El sistema centraliza el reporte de incidencias permitiendo a la comunidad universitaria (estudiantes y docentes) reportar problemas en tiempo real mediante una aplicación móvil, mientras que la administración gestiona, prioriza y analiza estos reportes a través de un panel web avanzado.

### 🎯 Objetivos Principales
* **Reducir tiempos de respuesta** centralizando la información.
* **Mejorar la trazabilidad** de los problemas de infraestructura.
* **Fomentar la participación** mediante una interfaz moderna y accesible.
* **Apoyar la toma de decisiones** mediante dashboards y métricas históricas.

---

## 🚀 Arquitectura Técnica

La solución sigue una arquitectura cliente-servidor basada en microservicios y contenedores, diseñada para ser escalable y modular.

```mermaid
graph TD
    User[📱 App Móvil React Native] -->|API REST| Gateway[⚙️ Backend Node.js]
    Admin[💻 Web Admin React] -->|API REST| Gateway
    Gateway -->|SQL| DB[(🗄️ PostgreSQL)]
    Gateway -->|HTTP| AI[🧠 Microservicio Python IA]


Componentes del Sistema

1. Backend (API Gateway): Desarrollado en Node.js/Express. Maneja la autenticación (JWT), la lógica de negocio y orquesta la comunicación entre servicios.
2. Frontend Web (Admin): SPA construida con React, Vite y Material UI. Permite filtrar incidencias, cambiar estados y visualizar estadísticas.
3. Aplicación Móvil (Usuario): Construida con React Native y Expo. Enfocada en la captura rápida de evidencia (fotos) y geolocalización.
4. Base de Datos: PostgreSQL para la persistencia relacional de usuarios, incidencias y bitácoras.
5. Módulo de Inteligencia Artificial: Microservicio en Python que utiliza bibliotecas como scikit-learn y RapidFuzz para:Moderación de contenido (detección de toxicidad).Deduplicación de reportes (similitud semántica).


🛠️ Stack Tecnológico

Área,Tecnologías
Backend,"Node.js, Express, TypeScript, Multer, JWT"
Frontend,"React, Vite, Material UI (MUI), Recharts"
Móvil,"React Native, Expo, Axios, SecureStore"
Base de Datos,"PostgreSQL, Supabase (Cloud)"
Inteligencia Artificial,"Python 3, scikit-learn, RapidFuzz, Groq Cloud (LLM Integration)"
Infraestructura,"Docker, Docker Compose, Render, Vercel"
DevOps,"GitHub Actions (CI/CD), EAS Build"


📦 Instalación y Despliegue 
El proyecto está dockerizado para facilitar el despliegue local.
Prerrequisitos
- Docker y Docker ComposeNode.
- js v18+ (si se corre sin Docker)

Opción A: Despliegue Rápido con Docker (Recomendado):

# 1. Clonar repositorio
git clone [https://github.com/Benjamin-Sanhueza/proyecto-crowdsourcing-final.git](https://github.com/Benjamin-Sanhueza/proyecto-crowdsourcing-final.git)

# 2. Configurar variables de entorno
# Crear archivo .env basado en .env.example

# 3. Levantar servicios
docker-compose up --build


Opción B: Instalación Manual1. 

1. BackendBashcd backend:
npm install
npm run dev

2. FrontendBashcd frontend-web
npm install
npm run dev

3. Aplicación MóvilBashcd mobile-app
npm install
npx expo start

🔧 Variables de Entorno (.env)
El sistema requiere las siguientes variables de configuración para conectar con los servicios en la nube:

Backend:
PORT: 3000
DATABASE_URL: URL de conexión a PostgreSQL (Supabase Transaction Pooler - Puerto 6543).
AI_API_KEY: API Key de Groq.
AI_MODEL: Modelo de IA a utilizar (ej: llama-3.3-70b-versatile).

Frontend:

Mobile:VITE_API_URL (Web) BASE_URL (Mobile): URL del backend desplegado en Render
 
 📱 Funcionalidades Clave
 1. Reporte Multimedia: Captura de fotos y ubicación desde la app móvil.
 2. Moderación IA: Bloqueo automático de reportes con lenguaje ofensivo mediante Llama 
 3. Dashboard Ejecutivo: Visualización de KPIs y métricas en tiempo real.
 4. Análisis Predictivo: Gráficos de regresión simple y múltiple para predecir fallos en infraestructura.
 5. Lightbox de Evidencia: Visualización detallada de fotografías de incidencias.
 
 
 👥 Equipo de Desarrollo
 Proyecto desarrollado por alumnos de la Universidad San Sebastián:
 Pedro Peña - Backend Developer
 Máximo Barahona - Database Administrator
 Sebastián Riquelme - Frontend Developer
 Raúl Soto - Mobile Developer
 Bruno Warner - Mobile Developer
 Benjamín Sanhueza - AI Moderation & Full Stack Integration

 Profesor Guía: Elizabeth Chicata CastroConcepción, Chile - Noviembre 2025

Concepción, Chile - Noviembre 2025