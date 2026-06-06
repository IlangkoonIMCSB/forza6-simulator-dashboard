# 🏎️ Forza 6 JDM Telemetry Dashboard — Dev Log

**Project**: Real-time Forza Motorsport 6 telemetry dashboard  
**Date**: June 6, 2026  
**Status**: ✅ All source code complete, dependencies installed, ready to run

---

## What Was Built

A two-part monorepo that captures Forza 6's live UDP telemetry stream and renders it as a glowing 90s JDM-style gauge cluster on a phone (via Expo).

```
sim dash/
├── server/                    # Node.js UDP → WebSocket bridge
│   ├── index.js               # UDP listener + Forza packet parser + socket.io
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/          ✅ installed
│
├── client-expo/               # Expo React Native dashboard app
│   ├── App.js                 # Main app — socket connection + 3-column layout
│   ├── app.json               # Expo config (landscape, dark mode)
│   ├── babel.config.js        # Babel with reanimated plugin
│   ├── theme.js               # Centralized JDM color tokens + font config
│   ├── package.json
│   ├── package-lock.json
│   ├── node_modules/          ✅ installed (894 packages)
│   ├── assets/
│   │   └── fonts/             # (empty — font download failed due to network)
│   └── components/
│       ├── RpmBar.js          # S2000-style 40-segment animated RPM bar
│       ├── SpeedDisplay.js    # 3-digit digital speed readout (速度)
│       ├── GearIndicator.js   # Large gear number with shift flash (ギア)
│       ├── TrackMap.js        # SVG mini-map with driven path trace (マップ)
│       └── TelemetryStrip.js  # Boost/Power/Torque/Fuel/Throttle/Brake/Laps
│
└── gemini-code-1780742707602.md  # Original spec file
```

---

## Backend — `server/index.js`

### What it does:
1. **Listens** on UDP port `5300` for Forza's raw binary telemetry packets
2. **Parses** the full 311-byte Car Dash packet format (Little-Endian), including:
   - Engine: RPM (current/max/idle)
   - Motion: speed (m/s → km/h), acceleration, velocity, angular velocity
   - Orientation: yaw, pitch, roll
   - Suspension: travel for all 4 wheels
   - Tires: slip ratio, slip angle, combined slip, temps (FL/FR/RL/RR)
   - Car info: class, performance index, drivetrain, cylinders
   - Position: world X/Y/Z coordinates
   - Power/torque, boost pressure, fuel level
   - Lap data: best lap, last lap, current lap time, race time, lap number
   - Inputs: throttle, brake, clutch, handbrake, gear, steering
3. **Broadcasts** parsed JSON via `socket.io` WebSocket on port `4000`
4. Filters out non-race packets (`isRaceOn === 0`)

### Dependencies:
- `socket.io` ^4.7.4 (dgram is built-in Node.js)

---

## Frontend — `client-expo/`

### Design Aesthetic: "Tokyo Midnight / JDM Street Legend"

| Token | Hex | Usage |
|-------|-----|-------|
| Deep Asphalt | `#0A0A0A` | Background |
| Neon Cyan | `#00FFFF` | Data readouts, primary accents |
| Glowing Magenta | `#FF00FF` | Redline warnings, brake input |
| Warning Orange | `#FF6B00` | Pre-redline RPM zone |
| Card Dark | `#111111` | Gauge card backgrounds |
| Border | `#1A1A1A` | Subtle panel borders |

### Layout: 3-Column Landscape Dashboard
```
┌─────────────┬──────────────────────────────┬─────────────┐
│  SPEED      │  RPM BAR (40 segments)       │  TRACK MAP  │
│  ┌───┬───┐  │  ████████████████████░░░░░   │  ┌─────┐    │
│  │ 2 │ 4 │7 │  0  1  2  3  4  5  6  7  8  9│  │  ·  │    │
│  └───┴───┘  │                              │  │ /   │    │
│  KM/H       │  BOOST | POWER | FUEL | THR  │  └─────┘    │
│             │   1.2  | 340HP | 85%  | 72%  │  X: 234     │
│   ┌──┐      │  BRK: ████░░░░ 45%          │  Z: -567    │
│   │ 3│ GEAR │  LAP 4 | BEST 1:23.456      │             │
│   └──┘      │                              │             │
└─────────────┴──────────────────────────────┴─────────────┘
```

### Components Built:

#### `RpmBar.js` — The hero gauge
- 40 individual animated segments using `react-native-reanimated`
- Each segment has its own `useAnimatedStyle` for hardware-accelerated color transitions
- **Cyan** segments (0-70%), **Orange** warning (70-85%), **Magenta** redline (85-100%)
- Inactive segments show dim colored ghosts for that "LCD off" look
- 50ms timing with easeOutQuad for responsive yet smooth sweeps
- Scale markers 0-9 along bottom, redline markers in magenta

#### `SpeedDisplay.js`
- 3-digit padded display (leading zeros dimmed in dark cyan)
- Each digit in its own bordered box (like a classic LCD panel)
- Thin speed bar beneath showing 0-350 km/h range
- Japanese label 速度 + English "SPEED"

#### `GearIndicator.js`
- Large 42px gear number in a bordered box
- `R` for reverse (gear=0), `N` for neutral (gear=11), `1-6` for forward
- **Scale pulse animation** on gear change (1.15x → 1x over 230ms)
- Switches to magenta glow when in redline RPM zone
- 6 position dots below showing which gear is engaged

#### `TrackMap.js`
- SVG mini-map that auto-scales to fit all driven points
- Accumulates up to 2000 position points (X/Z world coords)
- Cyan polyline trace with 60% opacity
- Glowing car position dot (inner solid + outer transparent ring)
- Grid overlay lines at 25%, 50%, 75%
- Live X/Z coordinate readout below

#### `TelemetryStrip.js`
- Compact data bar below RPM gauge showing:
  - **Boost** (Pa → PSI), **Power** (W → HP), **Torque** (Nm), **Fuel** (%)
  - **Throttle** & **Brake** input bars (0-100%, cyan/magenta)
  - **Lap** number, **Best** lap time, **Last** lap time
- Fuel goes magenta when below 15%
- Lap times formatted as `M:SS.mmm`

### Key Dependencies Installed:
- `expo` ~52.0.0
- `react-native-reanimated` ~3.16.0 (hardware-accelerated animations)
- `react-native-svg` 15.8.0 (track map)
- `socket.io-client` ^4.7.4 (WebSocket connection)
- `expo-font` ~13.0.0 (for Share Tech Mono when available)
- `expo-screen-orientation` ~8.0.0 (landscape lock)

---

## Known Issues / TODO When Network Returns

### ⚠️ Font Not Downloaded
- `assets/fonts/ShareTechMono-Regular.ttf` is **missing** — download failed due to network outage
- The app will work fine with platform-native `monospace` font as fallback
- **To fix**: Download Share Tech Mono TTF and place in `client-expo/assets/fonts/`, then uncomment the `useFonts` hook in App.js

### 🔧 Server IP Configuration
- `App.js` line 28: `const SERVER_URL = 'http://192.168.1.100:4000'`
- **Change `192.168.1.100` to your PC's actual LAN IP** before running on a physical device
- Find your IP: `ipconfig` in PowerShell, look for IPv4 Address under your Wi-Fi adapter

### 📱 Forza Data Out Setup
- In Forza 6 settings → HUD & Gameplay → Data Out
- Set IP to your PC's IP address
- Set Port to `5300`
- Set format to "Car Dash"

---

## How to Run

### 1. Start the backend:
```bash
cd server
node index.js
```
You should see:
```
╔══════════════════════════════════════════╗
║   FORZA 6 TELEMETRY BRIDGE              ║
║   UDP: 5300 → WebSocket: 4000            ║
╚══════════════════════════════════════════╝
🔌 WebSocket server running on port 4000
🏎️  Forza UDP listener on 0.0.0.0:5300
```

### 2. Start the Expo app:
```bash
cd client-expo
npx expo start
```
Then scan the QR code with Expo Go on your phone, or press `a` for Android emulator.

### 3. Start Forza and race!
Once in a race with Data Out enabled, telemetry will stream live to the dashboard.

---

## Architecture Decisions Made

1. **No NativeWind/Tailwind** — Went with raw StyleSheet.create() to avoid the NativeWind setup complexity and keep it simpler. The JDM aesthetic is achieved through the centralized `theme.js` color system.

2. **Centralized `theme.js`** — All colors and font config in one file so the entire aesthetic can be tweaked from a single place.

3. **Platform font fallback** — Instead of crashing when the TTF isn't available, the app gracefully falls back to system monospace. Share Tech Mono can be added later.

4. **Full packet parse** — The backend parses the ENTIRE 311-byte Forza packet, not just the fields the UI needs. This makes it easy to add new gauges later without touching the server.

5. **2000-point track buffer** — Track map keeps only the last 2000 position samples to prevent memory bloat on long races while still showing a clear track outline.

6. **50ms reanimated timing** — RPM bar updates use 50ms withTiming for responsive feel without jitter at 60Hz data rate.
