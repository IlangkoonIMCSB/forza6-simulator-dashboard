/**
 * Forza Motorsport 6 — UDP Telemetry Bridge
 * 
 * Listens for raw binary UDP packets on port 5300,
 * parses the Car Dash format (Little-Endian), and
 * streams clean JSON over WebSockets (port 4000).
 */

const dgram = require('dgram');
const { Server } = require('socket.io');
const http = require('http');

// ─── Config ──────────────────────────────────────────
const UDP_PORT = 5300;
const WS_PORT = 4000;

// ─── HTTP + WebSocket Server ─────────────────────────
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`💤 Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(WS_PORT, () => {
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
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

udpSocket.on('message', (msg) => {
  const data = parsePacket(msg);
  if (!data) return;

  // Broadcast to all connected WebSocket clients
  io.emit('telemetry', data);
});

udpSocket.on('listening', () => {
  const addr = udpSocket.address();
  console.log(`🏎️  Forza UDP listener on ${addr.address}:${addr.port}`);
});

udpSocket.on('error', (err) => {
  console.error('❌ UDP error:', err);
  udpSocket.close();
});

udpSocket.bind(UDP_PORT);

console.log(`
╔══════════════════════════════════════════╗
║   FORZA 6 TELEMETRY BRIDGE              ║
║   UDP: ${UDP_PORT} → WebSocket: ${WS_PORT}            ║
║                                          ║
║   Set Forza Data Out to this PC's IP     ║
║   Port: ${UDP_PORT}                              ║
╚══════════════════════════════════════════╝
`);
