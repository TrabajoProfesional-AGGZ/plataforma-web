**🖥️ [App en producción](https://sociounido-web.vercel.app/)**

# SocioUnido - Panel de Administración 🖥️

Este repositorio contiene el panel de administración web para la dirigencia y tesorería del club SocioUnido. Está construido con **React** (Create React App) en JavaScript puro (sin TypeScript), y permite gestionar el padrón de socios, usuarios administrativos, disciplinas, noticias, alertas y métricas del club.

## 🚀 Tecnologías Principales

*   **Framework:** React (Create React App / `react-scripts`)
*   **Autenticación:** Firebase Auth
*   **Gráficos:** Recharts
*   **Formularios:** React Hook Form + Framer Motion
*   **Despliegue:** Vercel

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu máquina local:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
*   Git

---

## 🛠️ Instalación y Configuración Local

**1. Clonar el repositorio**
```bash
git clone https://github.com/TrabajoProfesional-AGGZ/plataforma-web.git
cd plataforma-web
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**

Crear un archivo `.env.local` en la raíz del proyecto (a partir de `.env.local.example`):
```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_APP_ID=
```

**4. Correr la aplicación en modo desarrollo**
```bash
npm start
```
La aplicación queda disponible en `http://localhost:3000`.

## Cómo correr los tests

Este proyecto usa **Jest + React Testing Library**. Para correr la suite completa con reporte de cobertura (igual que en CI):

```bash
CI=true npx react-scripts test --watchAll=false --coverage
```
