# 📱 Infantil Elida MatchApp

Una aplicación web progresiva, ultraligera y orientada a dispositivos móviles (**Mobile-First**), diseñada para optimizar la consulta de calendarios, horarios, clasificaciones y actas arbitrales de la **Real Federación de Fútbol de Madrid (RFFM)**.

El proyecto nace para eliminar la fricción que sufren los usuarios (especialmente padres y familiares durante los días de partido) al intentar consultar información rápida desde sus teléfonos móviles en sitios federativos tradicionales o apps comerciales saturadas de publicidad.

---

## 📲 ¿Por qué esta aplicación? (Mobile-First UX)

* **⚡ Acceso Instantáneo en Movilidad**: Interfaz optimizada para pantallas táctiles, con tiempos de carga mínimos y consumo reducido de datos en redes móviles.
* **🚫 Experiencia Sin Interrupciones**: Diseño 100% limpio y libre de anuncios o pop-ups, permitiendo consultar el campo o la hora del partido en cuestión de segundos antes de salir de casa.
* **🎯 Ámbito Regional (RFFM)**: Diseñado específicamente para consumir el ecosistema de datos del fútbol base de la Comunidad de Madrid.

---

## 🚀 Funcionalidades Principales

* **📌 Gestión de Equipos Favoritos**: Permite guardar los equipos de tus hijos para acceder directamente a sus calendarios sin tener que seleccionar temporada, competición ni grupo en cada visita.
* **📍 Localización Navegable a Estadios**: Integración inteligente con mapas. Un solo toque sobre la dirección o el nombre del campo abre la ruta de navegación en **Google Maps**.
* **⏱️ Actas & Cronología de Partidos**: Consulta de actas oficiales renderizadas desde el servidor (`__NEXT_DATA__`) con alineaciones (titulares/suplentes), cuerpo técnico, árbitros y cronómetro evolutivo de eventos (goles, tarjetas y cambios).
* **📊 Clasificación Automatizada**: Cálculo dinámico en tiempo real de la tabla de posiciones como respaldo (*fallback*) en caso de que la fuente original no responda.

---

## 🌐 Demo En Vivo

Puedes probar la aplicación en funcionamiento directamente desde cualquier navegador móvil o de escritorio:

👉 https://elida-match-d9i14qh5v-isato.vercel.app

---

## 🛠️ Stack Tecnológico & Arquitectura

* **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Móvil (Flexbox, Grid, CSS Variables).
* **Backend / API**: Node.js desplegado mediante **Serverless Functions en Vercel**.
* **Integraciones y Persistencia**:
  * Persistencia en el dispositivo mediante `LocalStorage`.
  * Extraído dinámico de objetos JSON Next.js (`__NEXT_DATA__`) para procesar las actas arbitrales.
  * Sincronización automática de nuevos recintos deportivos mediante la **GitHub REST API** (`estadios.json`).

---

## ⚙️ Arquitectura de la Solución (Backend API Proxy)

Para garantizar un rendimiento fluido en móviles y superar restricciones de CORS, la app procesa las solicitudes a través de un intermediario *Serverless*:

```text
[ Dispositivo Móvil / UI ] 
       │ 
       ▼  (Petición ligera por HTTP)
[ Vercel Serverless Function: /api/rffm ] 
       │ 
       ├──► Extracción & Parseo del JSON __NEXT_DATA__ (Actas/Estadios)
       ├──► Sincronización automática del mapa de campos en GitHub
       │ 
       ▼  
[ Real Federación de Fútbol de Madrid (RFFM) ]
