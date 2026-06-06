/**
 * TrackMap — SVG mini-map showing driven path (Premium)
 * 
 * Plots positionX/Z world coordinates as a cyan trace
 * with a pulsing glowing dot for current car position.
 * Gradient-bordered map with responsive sizing.
 */

import React, { useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp, CARD_STYLE } from '../theme';

const PADDING = 12;

export default function TrackMap({ points, currentX, currentZ }) {
  // Responsive map size — use available space
  const mapSize = Math.min(wp(140), hp(140));

  // Pulsing car dot
  const dotPulse = useSharedValue(1);
  useEffect(() => {
    dotPulse.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, []);

  const dotPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
    opacity: 0.6 / dotPulse.value,
  }));

  const { scaledPoints, carPos } = useMemo(() => {
    if (points.length < 2) {
      return {
        scaledPoints: '',
        carPos: { x: mapSize / 2, y: mapSize / 2 },
      };
    }

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const scale = (mapSize - PADDING * 2) / Math.max(rangeX, rangeZ);

    const normalize = (x, z) => ({
      x: PADDING + (x - minX) * scale,
      y: PADDING + (z - minZ) * scale,
    });

    const scaled = points
      .map((p) => {
        const n = normalize(p.x, p.z);
        return `${n.x},${n.y}`;
      })
      .join(' ');

    const car = normalize(currentX, currentZ);

    return { scaledPoints: scaled, carPos: car };
  }, [points, currentX, currentZ, mapSize]);

  return (
    <View style={styles.container}>
      {/* Top accent */}
      <View style={styles.accentLine} />

      <View style={styles.labelRow}>
        <Text style={styles.labelJp}>マップ</Text>
        <Text style={styles.labelEn}>MAP</Text>
      </View>

      {/* Map with gradient border effect */}
      <View style={styles.mapBorderGlow}>
        <View style={[styles.mapBox, { width: mapSize, height: mapSize }]}>
          <Svg width={mapSize} height={mapSize} viewBox={`0 0 ${mapSize} ${mapSize}`}>
            {/* Background grid lines */}
            {[0.25, 0.5, 0.75].map((f) => (
              <React.Fragment key={f}>
                <Rect
                  x={mapSize * f}
                  y={0}
                  width={0.5}
                  height={mapSize}
                  fill={COLORS.border}
                  opacity={0.5}
                />
                <Rect
                  x={0}
                  y={mapSize * f}
                  width={mapSize}
                  height={0.5}
                  fill={COLORS.border}
                  opacity={0.5}
                />
              </React.Fragment>
            ))}

            {/* Track trace — main line */}
            {scaledPoints.length > 0 && (
              <Polyline
                points={scaledPoints}
                fill="none"
                stroke={COLORS.cyan}
                strokeWidth={2}
                strokeOpacity={0.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Car position — outer glow */}
            <Circle
              cx={carPos.x}
              cy={carPos.y}
              r={8}
              fill={COLORS.cyan}
              fillOpacity={0.12}
            />
            {/* Car position — mid ring */}
            <Circle
              cx={carPos.x}
              cy={carPos.y}
              r={5}
              fill={COLORS.cyan}
              fillOpacity={0.25}
            />
            {/* Car position — inner dot */}
            <Circle
              cx={carPos.x}
              cy={carPos.y}
              r={3}
              fill={COLORS.cyan}
              fillOpacity={1}
            />
          </Svg>
        </View>
      </View>

      {/* Coordinate readout */}
      <View style={styles.coordContainer}>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>X</Text>
          <Text style={styles.coordValue}>{currentX.toFixed(0)}</Text>
        </View>
        <View style={styles.coordDivider} />
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Z</Text>
          <Text style={styles.coordValue}>{currentZ.toFixed(0)}</Text>
        </View>
      </View>

      {/* Points counter */}
      <Text style={styles.pointCount}>{points.length} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CARD_STYLE,
    padding: wp(8),
    alignItems: 'center',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.cyanDim,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  labelRow: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  labelJp: {
    fontFamily: MONO_FONT,
    fontSize: fp(9),
    color: COLORS.textDim,
    letterSpacing: 4,
  },
  labelEn: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.cyanMid,
    letterSpacing: 6,
  },
  mapBorderGlow: {
    borderRadius: wp(8),
    padding: 1,
    backgroundColor: COLORS.borderGlow,
    ...SHADOWS.glow(COLORS.cyan),
  },
  mapBox: {
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(7),
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  coordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(5),
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: hp(2),
    paddingHorizontal: wp(8),
    gap: wp(6),
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  coordDivider: {
    width: 1,
    height: hp(12),
    backgroundColor: COLORS.border,
  },
  coordLabel: {
    fontFamily: MONO_FONT,
    fontSize: fp(7),
    color: COLORS.textDim,
  },
  coordValue: {
    fontFamily: MONO_FONT,
    fontSize: fp(10),
    color: COLORS.cyan,
    minWidth: wp(32),
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  pointCount: {
    fontFamily: MONO_FONT,
    fontSize: fp(6),
    color: COLORS.textDark,
    marginTop: hp(3),
    letterSpacing: 1,
  },
});
