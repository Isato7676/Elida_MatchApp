# ⚽ Infantil Elida MatchApp

Una aplicación web progresiva y ligera diseñada para optimizar la consulta de calendarios, resultados, clasificaciones y actas arbitrales de la **Real Federación de Fútbol de Madrid (RFFM)**. 

El proyecto resuelve la fragmentación de la información oficial (que habitualmente requiere navegar entre múltiples desplegables) agregando y parseando los datos públicos para ofrecer una **experiencia de usuario fluida, directa y accesible** para cualquier perfil de usuario.

---

## 💡 El Problema & La Solución

* **El Problema de UX**: Consultar datos del fútbol base madrileño suele requerir múltiples selecciones repetitivas por sesión o el uso de plataformas saturadas de elementos redundantes que ralentizan las peticiones.
* **Nuestra Solución**: Una interfaz minimalista de alta velocidad con persistencia local de preferencias (*Local Storage*), parseo dinámico en servidor y mapeo automático de campos mediante integración con proveedores de mapas.

---

## 🚀 Característica Clave & Funcionalidades

* **📌 Gestión de Equipos Favoritos**: Configuración en un clic para acceso instantáneo a calendarios y clasificaciones sin re-seleccionar temporada o grupo.
* **⏱️ Detalle de Partidos & Actas (SSR Extracción)**: Consulta completa de actas oficiales con alineaciones (titulares/suplentes), cuerpo técnico, cuerpo arbitral y cronología de eventos (goles, tarjetas, cambios) con marcador evolutivo.
* **📍 Localización de Estadios Integrada**: Sistema de mapeo dinámico que sincroniza y asocia códigos de campo con enlaces a Google Maps para facilitar la navegación a los recintos.
* **📊 Clasificación Automatizada**: Cálculo dinámico *fallback* de la tabla de posiciones en caso de indisponibilidad temporal de los datos estructurados del origen.
* **🎯 Ámbito Regional (RFFM)**: Diseñado específicamente para consumir el ecosistema de datos del fútbol base de la Comunidad de Madrid.

---

## 🛠️ Stack Tecnológico & Arquitectura

* **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (CSS Variables, Flexbox/Grid).
* **Backend / API**: Node.js desplegado como **Serverless Functions en Vercel**.
* **Integraciones**: 
  * Extracción y parseo de estados Next.js (`__NEXT_DATA__`) para el renderizado de actas.
  * Automatización vía **GitHub REST API** para la sincronización continua del dataset de estadios (`estadios.json`).

---

## ⚙️ Arquitectura de la Solución (Backend API Proxy)

Para evitar bloqueos de CORS y optimizar la extracción de actas dinámicas, la aplicación utiliza una arquitectura de intermediación a través de un endpoint *serverless*:

```text
[ Cliente Web / UI ] 
       │ 
       ▼  (Petición con endpoint + params)
[ Vercel Serverless Function: /api/rffm ] 
       │ 
       ├──► Parseo del bloque JSON __NEXT_DATA__ (Actas & Estadios)
       ├──► Sincronización automática de estadios en GitHub API
       │ 
       ▼  
[ Real Federación de Fútbol de Madrid (RFFM) ]
