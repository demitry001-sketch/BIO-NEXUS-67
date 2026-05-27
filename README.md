# ⚡ BIO NEXUS 67 — WORLD ENGINE v8.0

> MMORPG cyberpunk de navegador con motor 3D, 8 mundos viajables, NPC con IA, combate en tiempo real y servidor multijugador WebSocket.

![BIO NEXUS 67](https://img.shields.io/badge/VERSION-8.0%20NEXUS--7-00ff41?style=for-the-badge&labelColor=020d06)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![License](https://img.shields.io/badge/LICENSE-MIT-00ff41?style=for-the-badge&labelColor=020d06)

---

## 🌍 Características

| Feature | Detalle |
|---|---|
| **8 Mundos** | BIO NEXUS 67, NEXUS-7, VOID, CHROME DEPTH, BIO DEEP, ORBITAL MTX, DARK SECTOR, GRID NEXUS |
| **4 Razas** | Nórdico, Reptíloide, Insectoide, Gris — con stats y bonos únicos |
| **4 Clases** | Mercenario, Hacker, Cyborg, Fantasma |
| **8 Habilidades** | Strike, Shock, Shield, Heal, Flame, Frost, Combo, ULTI |
| **Multijugador** | Servidor Node.js + Socket.io con sincronización en tiempo real |
| **Sistema de Perfiles** | Login, registro, autoguardado cada 30s en localStorage |
| **NPC LYRA-7** | Agente de IA con diálogo, tienda de ítems e info táctica |
| **Motor 3D** | Three.js r128 con sombras, niebla por mundo y gravedad variable |
| **Portal de Mundos** | Viaje entre dimensiones con transición animada |
| **Anti-cheat** | Validación de velocidad y posición en el servidor |

---

## 🚀 Inicio Rápido

### Modo Solo (sin servidor)
Simplemente abre `index.html` en tu navegador. El juego funciona 100% offline.

### Modo Multijugador Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/demitry001-sketch/BIO-NEXUS-67.git
cd BIO-NEXUS-67

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor
npm start

# 4. Abrir en el navegador
# http://localhost:3000
```

### Modo Dev (con hot-reload)
```bash
npm run dev
```

---

## 📁 Estructura del Proyecto

```
BIO-NEXUS-67/
├── public/
│   ├── index.html                        ← Game Hub (menú principal)
│   ├── bionexus67_v8_nexus7_1.html       ← Juego completo v8.0 ★
│   ├── bionexus67_WORLD_v5_PROFILES_1_3.html
│   ├── bionexus67_WORLD_v5_PROFILES_1_2.html
│   ├── bionexus67_WORLD_v3_1_MP.html
│   ├── bionexus67_WORLD_v3_1.html
│   ├── bionexus67_MASTER.html            ← Panel Maestro 2D
│   ├── bionexus67_mapa_mundo.html        ← Mapa interactivo
│   ├── bionexus67_razas_panel.html       ← Panel de razas
│   ├── bionexus67_panel_personaje.html   ← Panel de personaje
│   ├── bionexus67_database_schema.html   ← Esquema de BD
│   └── bionexus67_MULTIPLAYER_GUIDE.html ← Guía multijugador
├── server.js      ← Servidor Node.js + Socket.io
├── package.json
└── README.md
```

> **Nota:** Copia todos los archivos `.html` dentro de la carpeta `/public/` para que el servidor los sirva correctamente.

---

## 🎮 Controles

| Tecla | Acción |
|---|---|
| `W / S` | Mover adelante / atrás |
| `Q / E` | Strafe izquierda / derecha |
| `A / D` | Rotar cámara |
| `Shift` | Correr |
| `1 – 8` | Habilidades |
| `Tab` | Auto-target (ciclar enemigos) |
| `P` | Portal de Mundos |
| `M` | Mapa táctico |
| `I` | Inventario |
| `C` | Estadísticas |
| `J` | Misiones |
| `ESC` | Menú de pausa / guardar |
| `F5` | Guardado manual |
| `Space` | Recoger loot cercano |
| `NumLock` | Auto-correr |
| `Ctrl + Click` | Ataque rápido / PvP |

---

## 🌐 Multijugador — Comandos de Chat

```
/status      → Ver stats del personaje actual
/mundo       → Info del mundo actual
/online      → Jugadores en el sector
/server URL  → Cambiar servidor en runtime
/nombre NAME → Cambiar nombre en runtime
/gg          → Mensaje de felicitación
/dungeon     → LFG para dungeon
/raid        → LFG para raid
/pvp         → Buscar duelo 1v1
/ayuda       → Lista de comandos
/save        → Guardar partida
```

---

## 🗂 Mundos Disponibles

| Mundo | Icono | Gravedad | Zonas | Descripción |
|---|---|---|---|---|
| BIO NEXUS 67 | 🌍 | 100% | 12 | Mundo principal. Zona de inicio. |
| NEXUS-7 | 🗺 | 100% | 7 | Submundo alternativo con tech avanzada. |
| VOID DIMENSION | 🌀 | 50% | 6 | Dimensión vacía. Gravedad reducida. |
| CHROME DEPTH | 🌊 | 120% | 7 | Ciudad submarina de cromo. |
| BIO DEEP | 🌿 | 100% | 7 | Bioma mutante. Toxinas. |
| ORBITAL MTX | 🚀 | 25% | 5 | Estación orbital. Gravedad casi cero. |
| DARK SECTOR | 💀 | 100% | 6 | PvP libre. Visibilidad mínima. |
| GRID NEXUS | ⬛ | 100% | 8 | Mundo digital. Todo es código. |

---

## ⚙️ Variables de Entorno

```env
PORT=3000           # Puerto del servidor (default: 3000)
NODE_ENV=production # Entorno (development/production)
```

---

## 🔧 API del Servidor

### Health Check
```
GET /health
→ { status, players, worlds, uptime }
```

### Eventos Socket.io (Cliente → Servidor)

| Evento | Payload | Rate Limit |
|---|---|---|
| `player:join` | `{name, level, race, cls, world, hp, maxHp}` | 1/conexión |
| `player:move` | `{x, y, z, yaw, world}` | 25/s |
| `player:hp` | `{hp, maxHp}` | ilimitado |
| `player:world_change` | `{world}` | — |
| `player:rename` | `{name}` | — |
| `player:update` | `{race, cls}` | — |
| `combat:hit` | `{targetId, damage}` | 10/s |
| `combat:ability` | `{abilityId, x, y, z}` | 5/s |
| `chat:message` | `string` | 3/s |
| `loot:pick` | `{lootId}` | 20/s |
| `ping:req` | — | — |

### Eventos Socket.io (Servidor → Cliente)

| Evento | Descripción |
|---|---|
| `world:state` | Estado inicial del mundo al conectarse |
| `player:joined` | Nuevo jugador en el sector |
| `player:moved` | Posición actualizada de otro jugador |
| `player:left` | Jugador salió del sector |
| `player:teleport` | Anti-cheat: corrección de posición |
| `player:hp_update` | HP actualizado de otro jugador |
| `player:updated` | Raza/clase actualizada de otro jugador |
| `player:killed` | El cliente fue eliminado |
| `player:kill_confirm` | Confirmación de kill al atacante |
| `combat:received` | Daño recibido de otro jugador |
| `combat:ability_cast` | Visual de habilidad de otro jugador |
| `chat:broadcast` | Mensaje de chat global |
| `loot:picked` | Loot recogido (eliminar del mundo) |
| `world:stats` | Estadísticas globales de jugadores |
| `ping:res` | Respuesta de ping |

---

## 🛡 Seguridad Anti-cheat

- ✅ Validación de velocidad máxima (32 u/s)
- ✅ Límite de mapa (±98 unidades)
- ✅ Rate limiting por evento y socket
- ✅ Sanitización de texto y nombres
- ✅ Validación de razas y clases permitidas
- ✅ Validación de mundos permitidos
- ✅ Daño PvP limitado a 1-500
- ✅ Limpieza de jugadores inactivos (>30s)

---

## 🏗 Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript ES2022
- **Motor 3D:** [Three.js r128](https://threejs.org/)
- **Multijugador:** [Socket.io 4.x](https://socket.io/)
- **Servidor:** [Node.js 20+](https://nodejs.org/) + [Express 4](https://expressjs.com/)
- **Tipografías:** Orbitron, Share Tech Mono (Google Fonts)
- **Persistencia:** localStorage (cliente) + memoria (servidor)

---

## 📜 Licencia

MIT © 2026 demitry001-sketch

---

<div align="center">

**⚡ BIO NEXUS 67 · WORLD ENGINE v8.0 · NEXUS-7 EDITION ⚡**

*Hecho con 💚 para la comunidad*

</div>
