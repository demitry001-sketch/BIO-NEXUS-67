'use strict';

// ════════════════════════════════════════════════════════════════════════
//  BIO NEXUS 67 — Servidor Multijugador
//  Node.js + Express + Socket.io 4.x
//
//  Instalar:  npm install
//  Ejecutar:  node server.js
//  Dev mode:  npx nodemon server.js
//  Puerto:    3000 (o PORT en variable de entorno)
//
//  El cliente HTML va en la carpeta /public/
//  Acceder:   http://localhost:3000
// ════════════════════════════════════════════════════════════════════════

const express    = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path       = require('path');

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval:  5000,
  pingTimeout:  10000,
});

// ── Archivos estáticos ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:  'ok',
    players: WORLD.players.size,
    worlds:  getWorldStats(),
    uptime:  Math.round(process.uptime()) + 's',
  });
});

// ── Ruta principal ────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ════════════════════════════════════════════════════════════════════════
//  ESTADO GLOBAL DEL MUNDO
// ════════════════════════════════════════════════════════════════════════
const WORLD = {
  players: new Map(),   // socketId → playerData
  chatLog: [],          // últimos 50 mensajes globales
};

function getWorldStats() {
  const stats = {};
  WORLD.players.forEach(p => {
    stats[p.world] = (stats[p.world] || 0) + 1;
  });
  return stats;
}

// ════════════════════════════════════════════════════════════════════════
//  RATE LIMITER (server-side)
// ════════════════════════════════════════════════════════════════════════
const _rl = new Map();

function rateOk(socketId, event, max = 25) {
  const key = `${socketId}:${event}`;
  const now = Date.now();
  let r = _rl.get(key);
  if (!r || now > r.reset) {
    r = { n: 0, reset: now + 1000 };
  }
  r.n++;
  _rl.set(key, r);
  return r.n <= max;
}

// Limpiar entradas viejas del rate limiter cada minuto
setInterval(() => {
  const now = Date.now();
  _rl.forEach((v, k) => { if (now > v.reset + 5000) _rl.delete(k); });
}, 60_000);

// ════════════════════════════════════════════════════════════════════════
//  VALIDACIÓN ANTI-CHEAT
// ════════════════════════════════════════════════════════════════════════
const MAX_SPEED   = 32;   // unidades/segundo máximo permitido
const MAP_LIMIT   = 98;   // límite de mapa

function validPos(player, pos) {
  // Límite de mapa
  if (Math.abs(pos.x) > MAP_LIMIT || Math.abs(pos.z) > MAP_LIMIT) return false;
  if (pos.y < -5 || pos.y > 50) return false;

  // Speed check
  if (!player.lastUpdate) { player.lastUpdate = Date.now(); return true; }
  const dt   = (Date.now() - player.lastUpdate) / 1000;
  const dist = Math.hypot(pos.x - player.x, pos.z - player.z);
  player.lastUpdate = Date.now();
  return dt < 0.01 || (dist / dt) <= MAX_SPEED;
}

function sanitizeText(text, maxLen = 200) {
  return String(text || '')
    .replace(/<[^>]*>/g, '')   // strip HTML
    .replace(/[^\w\s.,!?¡¿\-:;'"áéíóúñÁÉÍÓÚÑ@#%&()[\]{}+=*/\\|~`^]/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeName(name) {
  return String(name || 'ANON')
    .replace(/[^A-Za-z0-9_\-. ]/g, '')
    .trim()
    .slice(0, 24) || 'ANON';
}

// ════════════════════════════════════════════════════════════════════════
//  MANEJADORES DE SOCKET
// ════════════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  const addr = socket.handshake.address;
  console.log(`[+] Conectado: ${socket.id} (${addr})`);

  // ── JOIN ────────────────────────────────────────────────────────────
  socket.on('player:join', (data) => {
    const player = {
      id:          socket.id,
      name:        sanitizeName(data.name),
      x: 0, y: 1.75, z: 0,
      hp:          Math.max(1, Math.min(10000, parseInt(data.hp)    || 100)),
      maxHp:       Math.max(1, Math.min(10000, parseInt(data.maxHp) || 100)),
      level:       Math.max(1, Math.min(140,   parseInt(data.level) || 1)),
      race:        ['nordico','reptil','insecto','gris'].includes(data.race) ? data.race : 'nordico',
      cls:         ['Mercenario','Hacker','Cyborg','Fantasma'].includes(data.cls) ? data.cls : 'Mercenario',
      world:       data.world || 'main',
      lastUpdate:  Date.now(),
      joinedAt:    Date.now(),
    };

    WORLD.players.set(socket.id, player);
    socket.join('world:' + player.world);

    // Jugadores del mismo mundo
    const sameWorld = [...WORLD.players.values()].filter(
      p => p.world === player.world && p.id !== socket.id
    );

    // Estado inicial
    socket.emit('world:state', {
      yourId:    socket.id,
      worldName: player.world,
      players:   sameWorld,
      chat:      WORLD.chatLog.slice(-20),
    });

    // Notificar a otros
    socket.to('world:' + player.world).emit('player:joined', player);

    // Stats globales
    io.emit('world:stats', { players: WORLD.players.size });

    console.log(`  ↳ JOIN: ${player.name} [LV${player.level}] → ${player.world} (total: ${WORLD.players.size})`);
  });

  // ── MOVIMIENTO ──────────────────────────────────────────────────────
  socket.on('player:move', (pos) => {
    if (!rateOk(socket.id, 'move', 25)) return;

    const p = WORLD.players.get(socket.id);
    if (!p) return;

    if (!validPos(p, pos)) {
      // Devolver al servidor al último estado válido
      socket.emit('player:teleport', { x: p.x, y: p.y, z: p.z });
      console.warn(`  ⚠ Anti-cheat: teleport a ${p.name}`);
      return;
    }

    p.x = pos.x; p.y = pos.y; p.z = pos.z;

    socket.to('world:' + p.world).emit('player:moved', {
      id:  socket.id,
      x:   pos.x, y: pos.y, z: pos.z,
      yaw: pos.yaw,
    });
  });

  // ── HP UPDATE ───────────────────────────────────────────────────────
  socket.on('player:hp', (data) => {
    const p = WORLD.players.get(socket.id);
    if (!p) return;
    p.hp    = Math.max(0, Math.min(data.maxHp || 100, data.hp || 0));
    p.maxHp = Math.max(1, data.maxHp || 100);
    socket.to('world:' + p.world).emit('player:hp_update', {
      id: socket.id, hp: p.hp, maxHp: p.maxHp,
    });
  });

  // ── CAMBIO DE MUNDO ─────────────────────────────────────────────────
  socket.on('player:world_change', (data) => {
    const p = WORLD.players.get(socket.id);
    if (!p || !data.world) return;

    const VALID_WORLDS = ['main','nexus7','void','chrome','bio','orbital','dark','grid'];
    if (!VALID_WORLDS.includes(data.world)) return;

    // Salir del mundo anterior
    socket.leave('world:' + p.world);
    socket.to('world:' + p.world).emit('player:left', { id: socket.id });

    // Entrar al nuevo
    p.world = data.world;
    p.x = 0; p.y = 1.75; p.z = 0;
    p.lastUpdate = Date.now();
    socket.join('world:' + p.world);

    const sameWorld = [...WORLD.players.values()].filter(
      q => q.world === p.world && q.id !== socket.id
    );
    socket.emit('world:state', {
      yourId: socket.id, worldName: p.world, players: sameWorld,
    });
    socket.to('world:' + p.world).emit('player:joined', p);

    console.log(`  ↳ WORLD: ${p.name} → ${p.world}`);
  });

  // ── RENAME ──────────────────────────────────────────────────────────
  socket.on('player:rename', (data) => {
    const p = WORLD.players.get(socket.id);
    if (!p) return;
    p.name = sanitizeName(data.name);
    socket.to('world:' + p.world).emit('player:updated', {
      id: socket.id, name: p.name,
    });
  });

  // ── UPDATE (raza/clase) ─────────────────────────────────────────────
  socket.on('player:update', (data) => {
    const p = WORLD.players.get(socket.id);
    if (!p) return;
    const VALID_RACES = ['nordico','reptil','insecto','gris'];
    const VALID_CLS   = ['Mercenario','Hacker','Cyborg','Fantasma'];
    if (data.race && VALID_RACES.includes(data.race)) p.race = data.race;
    if (data.cls  && VALID_CLS.includes(data.cls))    p.cls  = data.cls;
    socket.to('world:' + p.world).emit('player:updated', {
      id: socket.id, race: p.race, cls: p.cls,
    });
  });

  // ── COMBATE PvP ─────────────────────────────────────────────────────
  socket.on('combat:hit', (data) => {
    if (!rateOk(socket.id, 'hit', 10)) return;

    const attacker = WORLD.players.get(socket.id);
    const target   = WORLD.players.get(data.targetId);
    if (!attacker || !target) return;

    // Validar mismo mundo
    if (attacker.world !== target.world) return;

    const dmg = Math.max(1, Math.min(500, parseInt(data.damage) || 0));

    io.to(data.targetId).emit('combat:received', {
      attackerId:   socket.id,
      attackerName: attacker.name,
      damage:       dmg,
    });

    target.hp = Math.max(0, target.hp - dmg);

    if (target.hp === 0) {
      io.to(data.targetId).emit('player:killed', { by: attacker.name });
      socket.emit('player:kill_confirm', { victim: target.name });
      target.hp = target.maxHp; // respawn HP automático
      console.log(`  ⚔ KILL: ${attacker.name} → ${target.name}`);
    }
  });

  // ── HABILIDAD (visual broadcast) ────────────────────────────────────
  socket.on('combat:ability', (data) => {
    if (!rateOk(socket.id, 'ability', 5)) return;
    const p = WORLD.players.get(socket.id);
    if (!p) return;
    socket.to('world:' + p.world).emit('combat:ability_cast', {
      casterId:  socket.id,
      abilityId: data.abilityId,
      x: p.x, y: p.y, z: p.z,
    });
  });

  // ── CHAT ────────────────────────────────────────────────────────────
  socket.on('chat:message', (text) => {
    if (!rateOk(socket.id, 'chat', 3)) return;
    const p     = WORLD.players.get(socket.id);
    const clean = sanitizeText(text);
    if (!clean) return;

    const msg = {
      senderId: socket.id,
      name:     p?.name || 'ANON',
      text:     clean,
      ts:       Date.now(),
    };

    // Guardar en log global (últimos 50)
    WORLD.chatLog.push(msg);
    if (WORLD.chatLog.length > 50) WORLD.chatLog.shift();

    io.emit('chat:broadcast', msg);
  });

  // ── LOOT ────────────────────────────────────────────────────────────
  socket.on('loot:pick', (data) => {
    if (!rateOk(socket.id, 'loot', 20)) return;
    const p = WORLD.players.get(socket.id);
    if (!p) return;
    socket.to('world:' + p.world).emit('loot:picked', { lootId: data.lootId });
  });

  // ── PING ────────────────────────────────────────────────────────────
  socket.on('ping:req', () => socket.emit('ping:res'));

  // ── DISCONNECT ──────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    const p = WORLD.players.get(socket.id);
    if (p) {
      socket.to('world:' + p.world).emit('player:left', { id: socket.id });
      WORLD.players.delete(socket.id);
      console.log(`[-] Desconectado: ${p.name} (${reason}) | Total: ${WORLD.players.size}`);
    }
    io.emit('world:stats', { players: WORLD.players.size });
  });
});

// ════════════════════════════════════════════════════════════════════════
//  LIMPIEZA DE JUGADORES INACTIVOS (cada 30s)
// ════════════════════════════════════════════════════════════════════════
setInterval(() => {
  const now     = Date.now();
  const TIMEOUT = 30_000; // 30 segundos sin movimiento

  WORLD.players.forEach((p, id) => {
    if (now - p.lastUpdate > TIMEOUT) {
      const sock = io.sockets.sockets.get(id);
      if (sock) {
        sock.disconnect(true);
      } else {
        io.to('world:' + p.world).emit('player:left', { id });
        WORLD.players.delete(id);
        console.log(`  👻 Ghost removido: ${p.name}`);
      }
    }
  });
}, 30_000);

// ════════════════════════════════════════════════════════════════════════
//  STATS EN CONSOLA (cada 5 minutos)
// ════════════════════════════════════════════════════════════════════════
setInterval(() => {
  if (WORLD.players.size > 0) {
    console.log(`\n📊 Stats — Jugadores: ${WORLD.players.size} | Uptime: ${Math.round(process.uptime())}s`);
    console.log('  Mundos:', getWorldStats());
  }
}, 300_000);

// ════════════════════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n⚡ BIO NEXUS 67 SERVER`);
  console.log(`   Puerto:    ${PORT}`);
  console.log(`   Cliente:   http://localhost:${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Modo:      ${process.env.NODE_ENV || 'development'}\n`);
});

// Manejo de errores no capturados
process.on('uncaughtException',  err => console.error('❌ uncaughtException:', err));
process.on('unhandledRejection', err => console.error('❌ unhandledRejection:', err));
