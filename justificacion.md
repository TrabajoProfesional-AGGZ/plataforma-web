---
layout: default
title: Justificación tecnológica
nav_order: 3
---

# 🛠️ Justificación tecnológica

En esta sección documentamos las decisiones técnicas tomadas para la construcción de la Plataforma Web de Administración, asegurando que la herramienta sea robusta, segura y capaz de manejar altos volúmenes de datos.

## Lenguajes, Frameworks y Herramientas

Para el panel de control administrativo, la prioridad fue la estructuración modular, la seguridad en el acceso a datos y la representación visual de métricas complejas:

* **React + Vite:** Se eligió React por su arquitectura basada en componentes, permitiendo crear una interfaz rica y dinámica (Data DataGrids, Modales, Gráficos) de manera eficiente. **Vite** se utiliza como entorno de construcción por su velocidad superior de empaquetado y HMR, optimizando los tiempos de desarrollo.
* **JavaScript y CSS Modular:** Al igual que en las demás interfaces del ecosistema, combinamos JavaScript moderno con CSS modular (apoyado en `tokens.css` y temas configurables). Esto asegura una transición fluida al aplicar la identidad visual (marca blanca) de cada club cliente sin reescribir la lógica.
* **Autenticación Delegada (Firebase):** La plataforma delega la gestión de sesiones seguras y recuperación de credenciales a Firebase, interactuando constantemente con el microservicio de autenticación para validar los permisos granulares (Roles) de cada administrador.
* **Visualización de Datos:** Se emplean librerías especializadas (como Recharts o Chart.js) encapsuladas en componentes (`DesgloseFinanzasChart.jsx`, `TendenciasPagoChart.jsx`) para renderizar de forma clara los KPIs financieros y predictivos del club.

## Calidad y Testing

* **Jest y React Testing Library:** Herramientas fundamentales (`jest.config.cjs` y archivos `*.test.js`) para garantizar que la compleja lógica de estado, paginación y renderizado condicional según permisos funcione sin fallas en cada módulo administrativo.
* **ESLint:** Configurado (`eslint.config.js`) para enforzar buenas prácticas, mantener un código limpio y reducir la deuda técnica en un repositorio de gran tamaño.

## Integración y Despliegue (CI/CD)

* **Vercel:** Plataforma de despliegue (`vercel.json`) que garantiza alta disponibilidad, latencia mínima mediante su CDN y previsualizaciones automáticas por cada cambio en el repositorio.
* **GitHub Actions:** Utilizamos flujos de integración continua (`ci.yml`) para automatizar la ejecución de la batería de pruebas y asegurar que la rama principal siempre contenga código estable y funcional.