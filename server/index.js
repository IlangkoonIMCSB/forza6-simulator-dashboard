/**
 * Forza Motorsport 6 — UDP Telemetry Bridge
 * 
 * Listens for raw binary UDP packets,
 * parses the Car Dash format (Little-Endian), and
 * streams clean JSON over WebSockets.
 * 
 * Usage:
 *   node index.js                        (defaults: UDP 5300, WS 4000)
 *   node index.js --udp 5300 --ws 4000   (custom ports)
 */

const dgram = require('dgram');
const { Server } = require('socket.io');
const http = require('http');
const os = require('os');
const readline = require('readline');

// ─── Parse CLI Arguments ─────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let udpPort = 5300;
  let wsPort = 4000;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--udp' || args[i] === '-u') && args[i + 1]) {
      udpPort = parseInt(args[i + 1], 10) || 5300;
      i++;
    }
    if ((args[i] === '--ws' || args[i] === '-w') && args[i + 1]) {
      wsPort = parseInt(args[i + 1], 10) || 4000;
      i++;
    }
  }

  return { udpPort, wsPort };
}

// ─── Get Local IP Addresses ──────────────────────────
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal/loopback and non-IPv4
      if (iface.internal || iface.family !== 'IPv4') continue;
      ips.push({ name, address: iface.address });
    }
  }

  return ips;
}

// ─── Console Colors ──────────────────────────────────
const c = {
  reset:   '\x1b[0m',
  bright:  '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  red:     '\x1b[31m',
  white:   '\x1b[37m',
  bgBlack: '\x1b[40m',
};

// ─── Pretty Print Helpers ────────────────────────────
function line(text = '', width = 56) {
  console.log(text);
}

function banner(udpPort, wsPort) {
  const ips = getLocalIPs();
  const primaryIP = ips.length > 0 ? ips[0].address : 'unknown';

  console.clear();
  console.log('');
  console.log(`${c.cyan}${c.bright}  ╔══════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.cyan}${c.bright}  ║                                                      ║${c.reset}`);
  console.log(`${c.cyan}${c.bright}  ║   ${c.white}🏎️  FORZA 6 TELEMETRY BRIDGE                      ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}${c.bright}  ║   ${c.dim}UDP → WebSocket Relay Server                      ${c.cyan}${c.bright}║${c.reset}`);
  console.log(`${c.cyan}${c.bright}  ║                                                      ║${c.reset}`);
  console.log(`${c.cyan}${c.bright}  ╚══════════════════════════════════════════════════════╝${c.reset}`);
  console.log('');

  // Server status
  console.log(`${c.green}${c.bright}  ✓ Server is running!${c.reset}`);
  console.log(`${c.dim}  ─────────────────────────────────────────────────────${c.reset}`);
  console.log(`${c.white}  UDP Listener:     ${c.cyan}${c.bright}port ${udpPort}${c.reset}`);
  console.log(`${c.white}  WebSocket Server: ${c.cyan}${c.bright}port ${wsPort}${c.reset}`);
  console.log('');

  // Show all detected IPs
  console.log(`${c.yellow}${c.bright}  📡 Your PC IP Address(es):${c.reset}`);
  console.log(`${c.dim}  ─────────────────────────────────────────────────────${c.reset}`);
  if (ips.length === 0) {
    console.log(`${c.red}  ⚠  No network interfaces found!${c.reset}`);
  } else {
    ips.forEach((ip, i) => {
      const tag = i === 0 ? `${c.green} ← likely this one` : '';
      console.log(`${c.white}  ${c.bright}${ip.address}${c.reset}${c.dim}  (${ip.name})${tag}${c.reset}`);
    });
  }

  console.log('');
  console.log(`${c.dim}  ═════════════════════════════════════════════════════${c.reset}`);

  // Step 1 — Forza Setup
  console.log('');
  console.log(`${c.magenta}${c.bright}  STEP 1: FORZA MOTORSPORT SETUP${c.reset}`);
  console.log(`${c.dim}  ─────────────────────────────────────────────────────${c.reset}`);
  console.log(`${c.white}  1. Open Forza Motorsport 6 (or Horizon)${c.reset}`);
  console.log(`${c.white}  2. Go to ${c.bright}Settings → HUD and Gameplay${c.reset}`);
  console.log(`${c.white}  3. Set ${c.bright}Data Out${c.reset}${c.white} to:  ${c.cyan}${c.bright}ON${c.reset}`);
  console.log(`${c.white}  4. Set ${c.bright}Data Out IP${c.reset}${c.white}:  ${c.cyan}${c.bright}${primaryIP}${c.reset}`);
  console.log(`${c.white}  5. Set ${c.bright}Data Out Port${c.reset}${c.white}: ${c.cyan}${c.bright}${udpPort}${c.reset}`);
  console.log('');

  // Step 2 — Phone Setup
  console.log(`${c.magenta}${c.bright}  STEP 2: PHONE APP SETUP${c.reset}`);
  console.log(`${c.dim}  ─────────────────────────────────────────────────────${c.reset}`);
  console.log(`${c.white}  1. Make sure your phone is on the ${c.bright}same Wi-Fi${c.reset}`);
  console.log(`${c.white}  2. Open the Forza Telemetry app on your phone${c.reset}`);
  console.log(`${c.white}  3. Tap the ${c.bright}⚙ Settings${c.reset}${c.white} icon${c.reset}`);
  console.log(`${c.white}  4. Set Server URL to:${c.reset}`);
  console.log(`${c.cyan}${c.bright}     http://${primaryIP}:${wsPort}${c.reset}`);
  console.log(`${c.white}  5. Save and you're connected! 🎉${c.reset}`);
  console.log('');

  console.log(`${c.dim}  ═════════════════════════════════════════════════════${c.reset}`);
  console.log('');
  console.log(`${c.dim}  Press ${c.white}Q${c.dim} to quit  |  Press ${c.white}R${c.dim} to refresh IP  |  Press ${c.white}H${c.dim} for help${c.reset}`);
  console.log(`${c.dim}  ─────────────────────────────────────────────────────${c.reset}`);
  console.log('');
}

function showHelp() {
  console.log('');
  console.log(`${c.yellow}${c.bright}  ╔══════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.yellow}${c.bright}  ║  HELP                                                ║${c.reset}`);
  console.log(`${c.yellow}${c.bright}  ╚══════════════════════════════════════════════════════╝${c.reset}`);
  console.log('');
  console.log(`${c.white}  ${c.bright}Command-line options:${c.reset}`);
  console.log(`${c.white}    --udp, -u <port>   Set the UDP listen port (default: 5300)${c.reset}`);
  console.log(`${c.white}    --ws,  -w <port>   Set the WebSocket port (default: 4000)${c.reset}`);
  console.log('');
  console.log(`${c.white}  ${c.bright}Example:${c.reset}`);
  console.log(`${c.cyan}    forza-telemetry-bridge.exe --udp 5300 --ws 4000${c.reset}`);
  console.log('');
  console.log(`${c.white}  ${c.bright}Troubleshooting:${c.reset}`);
  console.log(`${c.white}  • Phone can't connect? Check Windows Firewall:${c.reset}`);
  console.log(`${c.white}    Allow inbound on ports ${c.cyan}${UDP_PORT}${c.white} (UDP) and ${c.cyan}${WS_PORT}${c.white} (TCP)${c.reset}`);
  console.log(`${c.white}  • No telemetry data? Make sure Forza's Data Out IP${c.reset}`);
  console.log(`${c.white}    matches the IP shown above.${c.reset}`);
  console.log(`${c.white}  • Wrong IP? Press ${c.bright}R${c.reset}${c.white} to refresh.${c.reset}`);
  console.log('');
}

// ─── Config ──────────────────────────────────────────
const { udpPort: UDP_PORT, wsPort: WS_PORT } = parseArgs();

// ─── HTTP + WebSocket Server ─────────────────────────
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

let clientCount = 0;

io.on('connection', (socket) => {
  clientCount++;
  console.log(`${c.green}  ⚡ Phone connected!${c.reset} ${c.dim}(${socket.id}) — ${clientCount} device(s) active${c.reset}`);
  socket.on('disconnect', () => {
    clientCount--;
    console.log(`${c.yellow}  💤 Phone disconnected${c.reset} ${c.dim}(${socket.id}) — ${clientCount} device(s) active${c.reset}`);
  });
});

httpServer.listen(WS_PORT, () => {
  // Server ready — banner already shown
});

// ─── Forza Packet Parser ─────────────────────────────
// Based on Forza Motorsport "Car Dash" format
// Packet size: 311 bytes (FM6) or 324 bytes (FM7/FH4+)
function parsePacket(buf) {
  if (buf.length < 311) return null;

  const isRaceOn = buf.readInt32LE(0);
  if (isRaceOn === 0) return null; // Not in race

  return {
    isRaceOn,

    // Timestamps
    timestampMs: buf.readUInt32LE(4),

    // Engine
    engineMaxRpm:     buf.readFloatLE(8),
    engineIdleRpm:    buf.readFloatLE(12),
    currentEngineRpm: buf.readFloatLE(16),

    // Acceleration (g-forces)
    accelerationX: buf.readFloatLE(20),
    accelerationY: buf.readFloatLE(24),
    accelerationZ: buf.readFloatLE(28),

    // Velocity
    velocityX: buf.readFloatLE(32),
    velocityY: buf.readFloatLE(36),
    velocityZ: buf.readFloatLE(40),

    // Angular velocity
    angularVelocityX: buf.readFloatLE(44),
    angularVelocityY: buf.readFloatLE(48),
    angularVelocityZ: buf.readFloatLE(52),

    // Orientation (yaw/pitch/roll)
    yaw:   buf.readFloatLE(56),
    pitch: buf.readFloatLE(60),
    roll:  buf.readFloatLE(64),

    // Suspension travel (normalized)
    suspensionTravelFL: buf.readFloatLE(68),
    suspensionTravelFR: buf.readFloatLE(72),
    suspensionTravelRL: buf.readFloatLE(76),
    suspensionTravelRR: buf.readFloatLE(80),

    // Tire slip ratio
    tireSlipRatioFL: buf.readFloatLE(84),
    tireSlipRatioFR: buf.readFloatLE(88),
    tireSlipRatioRL: buf.readFloatLE(92),
    tireSlipRatioRR: buf.readFloatLE(96),

    // Wheel rotation speed
    wheelRotationSpeedFL: buf.readFloatLE(100),
    wheelRotationSpeedFR: buf.readFloatLE(104),
    wheelRotationSpeedRL: buf.readFloatLE(108),
    wheelRotationSpeedRR: buf.readFloatLE(112),

    // Wheel on rumble strip
    wheelOnRumbleFL: buf.readFloatLE(116),
    wheelOnRumbleFR: buf.readFloatLE(120),
    wheelOnRumbleRL: buf.readFloatLE(124),
    wheelOnRumbleRR: buf.readFloatLE(128),

    // Wheel in puddle depth
    wheelInPuddleFL: buf.readFloatLE(132),
    wheelInPuddleFR: buf.readFloatLE(136),
    wheelInPuddleRL: buf.readFloatLE(140),
    wheelInPuddleRR: buf.readFloatLE(144),

    // Surface rumble
    surfaceRumbleFL: buf.readFloatLE(148),
    surfaceRumbleFR: buf.readFloatLE(152),
    surfaceRumbleRL: buf.readFloatLE(156),
    surfaceRumbleRR: buf.readFloatLE(160),

    // Tire slip angle
    tireSlipAngleFL: buf.readFloatLE(164),
    tireSlipAngleFR: buf.readFloatLE(168),
    tireSlipAngleRL: buf.readFloatLE(172),
    tireSlipAngleRR: buf.readFloatLE(176),

    // Tire combined slip
    tireCombinedSlipFL: buf.readFloatLE(180),
    tireCombinedSlipFR: buf.readFloatLE(184),
    tireCombinedSlipRL: buf.readFloatLE(188),
    tireCombinedSlipRR: buf.readFloatLE(192),

    // Suspension travel (meters)
    suspensionTravelMetersFL: buf.readFloatLE(196),
    suspensionTravelMetersFR: buf.readFloatLE(200),
    suspensionTravelMetersRL: buf.readFloatLE(204),
    suspensionTravelMetersRR: buf.readFloatLE(208),

    // Car info
    carOrdinal:       buf.readInt32LE(212),
    carClass:         buf.readInt32LE(216),
    carPerformanceIndex: buf.readInt32LE(220),
    drivetrainType:   buf.readInt32LE(224),
    numCylinders:     buf.readInt32LE(228),

    // Position (world-space)
    positionX: buf.readFloatLE(232),
    positionY: buf.readFloatLE(236),
    positionZ: buf.readFloatLE(240),

    // Speed (m/s → km/h)
    speedMps: buf.readFloatLE(244),
    speedKmh: Math.round(buf.readFloatLE(244) * 3.6),

    // Power & torque
    power:  buf.readFloatLE(248),
    torque: buf.readFloatLE(252),

    // Tire temps
    tireTempFL: buf.readFloatLE(256),
    tireTempFR: buf.readFloatLE(260),
    tireTempRL: buf.readFloatLE(264),
    tireTempRR: buf.readFloatLE(268),

    // Boost
    boost: buf.readFloatLE(272),

    // Fuel
    fuel: buf.readFloatLE(276),

    // Distance traveled
    distanceTraveled: buf.readFloatLE(280),

    // Best/Last lap times
    bestLap:  buf.readFloatLE(284),
    lastLap:  buf.readFloatLE(288),
    currentLap: buf.readFloatLE(292),
    currentRaceTime: buf.readFloatLE(296),

    // Lap info
    lapNumber:  buf.readUInt16LE(300),
    racePosition: buf.readUInt8(302),

    // Throttle / Brake / Clutch / Handbrake / Gear / Steer
    accel:     buf.readUInt8(303),
    brake:     buf.readUInt8(304),
    clutch:    buf.readUInt8(305),
    handbrake: buf.readUInt8(306),
    gear:      buf.readUInt8(307),
    steer:     buf.readInt8(308),

    // Normalized driving line
    normalizedDrivingLine:   buf.readInt8(309),
    normalizedAIBrakeDifference: buf.readInt8(310),
  };
}

// ─── UDP Listener ────────────────────────────────────
const udpSocket = dgram.createSocket('udp4');
let packetCount = 0;
let lastStatusTime = Date.now();

udpSocket.on('message', (msg) => {
  const data = parsePacket(msg);
  if (!data) return;

  packetCount++;

  // Log first telemetry received
  if (packetCount === 1) {
    console.log(`${c.green}${c.bright}  🏁 Receiving telemetry from Forza!${c.reset}`);
  }

  // Periodic status every 30 seconds
  if (Date.now() - lastStatusTime > 30000) {
    console.log(`${c.dim}  📊 ${packetCount} packets received | ${clientCount} device(s) connected${c.reset}`);
    lastStatusTime = Date.now();
  }

  // Broadcast to all connected WebSocket clients
  io.emit('telemetry', data);
});

udpSocket.on('listening', () => {
  // Already logged in banner
});

udpSocket.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`${c.red}${c.bright}  ❌ ERROR: Port ${UDP_PORT} is already in use!${c.reset}`);
    console.log(`${c.yellow}  Try a different port: forza-telemetry-bridge.exe --udp 5301${c.reset}`);
  } else {
    console.log(`${c.red}  ❌ UDP error: ${err.message}${c.reset}`);
  }
  udpSocket.close();
});

udpSocket.bind(UDP_PORT);

// ─── Show Banner ─────────────────────────────────────
banner(UDP_PORT, WS_PORT);

// ─── Keyboard Controls ───────────────────────────────
if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      console.log(`\n${c.yellow}  👋 Shutting down...${c.reset}\n`);
      process.exit(0);
    }
    if (key.name === 'r') {
      banner(UDP_PORT, WS_PORT);
    }
    if (key.name === 'h') {
      showHelp();
    }
  });
}

// ─── Graceful Shutdown ───────────────────────────────
process.on('SIGINT', () => {
  console.log(`\n${c.yellow}  👋 Shutting down...${c.reset}\n`);
  udpSocket.close();
  httpServer.close();
  process.exit(0);
});
