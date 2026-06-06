/**
 * Forza 6 JDM Telemetry Dashboard — Premium Edition
 * 
 * 90s/00s JDM aesthetic — deep asphalt blacks,
 * neon cyan readouts, magenta redline warnings.
 * Glassmorphic depth with responsive layout.
 * 
 * Settings: configurable server URL + UDP port.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { io } from 'socket.io-client';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp, CARD_STYLE } from './theme';

import RpmBar from './components/RpmBar';
import SpeedDisplay from './components/SpeedDisplay';
import GearIndicator from './components/GearIndicator';
import TrackMap from './components/TrackMap';
import TelemetryStrip from './components/TelemetryStrip';
import SettingsScreen, { loadSettings } from './components/SettingsScreen';

// ─── Connection Pulse Dot ────────────────────────────────
function StatusDot({ connected }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (connected) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [connected]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: connected ? 1 : 0.5,
  }));

  const dotColor = connected ? COLORS.green : COLORS.red;

  return (
    <View style={styles.statusDotContainer}>
      {/* Outer glow ring */}
      <Animated.View style={[
        styles.statusDotGlow,
        pulseStyle,
        { backgroundColor: connected ? COLORS.greenDim : COLORS.redDim },
      ]} />
      {/* Inner dot */}
      <View style={[
        styles.statusDot,
        { backgroundColor: dotColor },
        SHADOWS.glow(dotColor),
      ]} />
    </View>
  );
}

// ─── Gear Icon for Settings ──────────────────────────────
function GearIcon() {
  return (
    <Text style={styles.gearIconText}>⚙</Text>
  );
}

export default function App() {
  const [telemetry, setTelemetry] = useState({
    currentEngineRpm: 0,
    engineMaxRpm: 9000,
    engineIdleRpm: 800,
    speedKmh: 0,
    gear: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    boost: 0,
    power: 0,
    torque: 0,
    accel: 0,
    brake: 0,
    tireTempFL: 0,
    tireTempFR: 0,
    tireTempRL: 0,
    tireTempRR: 0,
    lapNumber: 0,
    bestLap: 0,
    lastLap: 0,
    fuel: 0,
  });

  const [connected, setConnected] = useState(false);
  const [trackPoints, setTrackPoints] = useState([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:4000');
  const [udpPort, setUdpPort] = useState('5300');
  const socketRef = useRef(null);
  const [screenDims, setScreenDims] = useState(Dimensions.get('window'));

  // Listen for dimension changes (responsive)
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDims(window);
    });
    return () => sub?.remove();
  }, []);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings().then(({ serverUrl: url, udpPort: port }) => {
      setServerUrl(url);
      setUdpPort(port);
    });
  }, []);

  // Socket connection — reconnects when serverUrl changes
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(serverUrl, {
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to telemetry server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('💤 Disconnected from server');
      setConnected(false);
    });

    socket.on('telemetry', (data) => {
      setTelemetry(data);
      // Accumulate track points for mini-map
      setTrackPoints((prev) => {
        const next = [...prev, { x: data.positionX, z: data.positionZ }];
        // Keep last 2000 points to avoid memory bloat
        if (next.length > 2000) return next.slice(-2000);
        return next;
      });
    });

    return () => socket.disconnect();
  }, [serverUrl]);

  const handleSettingsSave = useCallback((newUrl, newPort) => {
    setServerUrl(newUrl);
    setUdpPort(newPort);
  }, []);

  const rpmPercent = telemetry.engineMaxRpm > 0
    ? telemetry.currentEngineRpm / telemetry.engineMaxRpm
    : 0;

  const isRedline = rpmPercent > 0.85;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ─── Top Status Bar ──────────────────────── */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <StatusDot connected={connected} />
          <Text style={[
            styles.statusText,
            { color: connected ? COLORS.green : COLORS.red },
          ]}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </Text>
        </View>

        <View style={styles.statusCenter}>
          <Text style={styles.headerTitle}>FORZA TELEMETRY</Text>
          <Text style={styles.headerTitleJp}>フォルツァ テレメトリー</Text>
        </View>

        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={styles.settingsBtn}
          activeOpacity={0.7}
        >
          <GearIcon />
        </TouchableOpacity>
      </View>

      {/* Glow separator line */}
      <View style={styles.separatorGlow} />

      {/* ─── Main Dashboard Grid ─────────────────── */}
      <View style={styles.dashboardGrid}>
        {/* Left Column — Speed + Gear */}
        <View style={styles.leftColumn}>
          <SpeedDisplay speed={telemetry.speedKmh} />
          <GearIndicator gear={telemetry.gear} isRedline={isRedline} />
        </View>

        {/* Center Column — RPM Bar (dominant) */}
        <View style={styles.centerColumn}>
          <RpmBar
            currentRpm={telemetry.currentEngineRpm}
            maxRpm={telemetry.engineMaxRpm}
            idleRpm={telemetry.engineIdleRpm}
          />
          <TelemetryStrip
            boost={telemetry.boost}
            power={telemetry.power}
            torque={telemetry.torque}
            accel={telemetry.accel}
            brake={telemetry.brake}
            fuel={telemetry.fuel}
            lapNumber={telemetry.lapNumber}
            bestLap={telemetry.bestLap}
            lastLap={telemetry.lastLap}
          />
        </View>

        {/* Right Column — Track Map */}
        <View style={styles.rightColumn}>
          <TrackMap
            points={trackPoints}
            currentX={telemetry.positionX}
            currentZ={telemetry.positionZ}
          />
        </View>
      </View>

      {/* ─── Settings Modal ──────────────────────── */}
      <SettingsScreen
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSave={handleSettingsSave}
        currentUrl={serverUrl}
        currentPort={udpPort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: wp(12),
    paddingTop: hp(4),
  },

  // ─── Status Bar ─────────────────────────────
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(4),
    marginBottom: hp(4),
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: wp(80),
  },
  statusDotContainer: {
    width: wp(16),
    height: wp(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(6),
  },
  statusDotGlow: {
    position: 'absolute',
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
  },
  statusDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
  statusText: {
    fontFamily: MONO_FONT,
    fontSize: fp(9),
    letterSpacing: 2,
  },
  statusCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: MONO_FONT,
    fontSize: fp(11),
    color: COLORS.cyan,
    letterSpacing: 5,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerTitleJp: {
    fontFamily: MONO_FONT,
    fontSize: fp(7),
    color: COLORS.textDim,
    letterSpacing: 3,
    marginTop: 1,
  },
  settingsBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  gearIconText: {
    fontSize: fp(16),
    color: COLORS.textDim,
  },
  separatorGlow: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: hp(6),
    // Subtle cyan tint on the separator
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  // ─── Dashboard Grid ────────────────────────
  dashboardGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: wp(8),
  },
  leftColumn: {
    flex: 2,
    justifyContent: 'center',
    gap: hp(8),
  },
  centerColumn: {
    flex: 5,
    justifyContent: 'center',
    gap: hp(8),
  },
  rightColumn: {
    flex: 2,
    justifyContent: 'center',
  },
});
