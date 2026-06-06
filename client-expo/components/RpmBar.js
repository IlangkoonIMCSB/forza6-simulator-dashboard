/**
 * RpmBar — S2000-style horizontal RPM bar graph (Premium)
 * 
 * 40-segment animated bar with liquid LED appearance,
 * peak RPM marker, enhanced glow effects.
 * Fully responsive across screen sizes.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp, CARD_STYLE } from '../theme';

const SEGMENT_COUNT = 40;
const REDLINE_THRESHOLD = 0.85;
const WARNING_THRESHOLD = 0.70;

export default function RpmBar({ currentRpm, maxRpm, idleRpm }) {
  const rpmPercent = useSharedValue(0);
  const peakRpm = useRef(0);

  useEffect(() => {
    const target = maxRpm > 0 ? Math.min(currentRpm / maxRpm, 1) : 0;
    rpmPercent.value = withTiming(target, {
      duration: 50,
      easing: Easing.out(Easing.quad),
    });
    // Track peak
    if (currentRpm > peakRpm.current) peakRpm.current = currentRpm;
  }, [currentRpm, maxRpm]);

  const segments = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    segments.push(
      <RpmSegment
        key={i}
        index={i}
        total={SEGMENT_COUNT}
        rpmPercent={rpmPercent}
      />
    );
  }

  const rpmDisplay = Math.round(currentRpm);
  const rpmK = (currentRpm / 1000).toFixed(1);
  const peakK = (peakRpm.current / 1000).toFixed(1);
  const rpmPct = maxRpm > 0 ? Math.round((currentRpm / maxRpm) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Inner glow accent */}
      <View style={styles.glowAccent} />

      {/* Label Row */}
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <Text style={styles.labelJp}>回転数</Text>
          <Text style={styles.labelEn}>RPM</Text>
        </View>
        <View style={styles.rpmReadout}>
          <Text style={styles.rpmValue}>{rpmDisplay}</Text>
          <View style={styles.rpmMeta}>
            <Text style={styles.rpmK}>{rpmK}k</Text>
            <Text style={styles.rpmPct}>{rpmPct}%</Text>
          </View>
        </View>
        <View style={styles.peakBadge}>
          <Text style={styles.peakLabel}>PEAK</Text>
          <Text style={styles.peakValue}>{peakK}k</Text>
        </View>
      </View>

      {/* Bar Graph */}
      <View style={styles.barContainer}>
        {segments}
      </View>

      {/* Scale markers */}
      <View style={styles.scaleRow}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Text
            key={n}
            style={[
              styles.scaleMark,
              n >= Math.floor(REDLINE_THRESHOLD * 10) && styles.scaleMarkRed,
              n >= Math.floor(WARNING_THRESHOLD * 10) && n < Math.floor(REDLINE_THRESHOLD * 10) && styles.scaleMarkWarn,
            ]}
          >
            {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Individual Segment ──────────────────────────────
function RpmSegment({ index, total, rpmPercent }) {
  const segmentThreshold = index / total;
  const isRedZone = segmentThreshold >= REDLINE_THRESHOLD;
  const isWarningZone = segmentThreshold >= WARNING_THRESHOLD;

  const animatedStyle = useAnimatedStyle(() => {
    const active = rpmPercent.value >= segmentThreshold;
    const opacity = active ? 1 : 0.08;

    let bgColor;
    if (isRedZone) {
      bgColor = active ? COLORS.magenta : COLORS.magentaDark;
    } else if (isWarningZone) {
      bgColor = active ? COLORS.orange : COLORS.orangeDark;
    } else {
      bgColor = active ? COLORS.cyan : COLORS.cyanBgDim;
    }

    return {
      opacity,
      backgroundColor: bgColor,
      shadowColor: active ? bgColor : 'transparent',
      shadowOpacity: active ? 0.9 : 0,
      shadowRadius: active ? 6 : 0,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <Animated.View style={[styles.segment, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  container: {
    ...CARD_STYLE,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  glowAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.cyanDim,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(6),
  },
  labelLeft: {
    marginRight: wp(10),
  },
  labelJp: {
    fontFamily: MONO_FONT,
    fontSize: fp(10),
    color: COLORS.textDim,
  },
  labelEn: {
    fontFamily: MONO_FONT,
    fontSize: fp(9),
    color: COLORS.cyanMid,
    letterSpacing: 3,
  },
  rpmReadout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  rpmValue: {
    fontFamily: MONO_FONT,
    fontSize: fp(28),
    color: COLORS.cyan,
    letterSpacing: 2,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  rpmMeta: {
    marginLeft: wp(6),
  },
  rpmK: {
    fontFamily: MONO_FONT,
    fontSize: fp(10),
    color: COLORS.textDim,
  },
  rpmPct: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.textDark,
  },
  peakBadge: {
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  peakLabel: {
    fontFamily: MONO_FONT,
    fontSize: fp(6),
    color: COLORS.textDark,
    letterSpacing: 2,
  },
  peakValue: {
    fontFamily: MONO_FONT,
    fontSize: fp(10),
    color: COLORS.orangeLight,
  },
  barContainer: {
    flexDirection: 'row',
    height: hp(38),
    gap: wp(1.5),
    alignItems: 'flex-end',
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: wp(2),
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(4),
    paddingHorizontal: wp(2),
  },
  scaleMark: {
    fontFamily: MONO_FONT,
    fontSize: fp(7),
    color: COLORS.textDark,
  },
  scaleMarkRed: {
    color: COLORS.magenta,
    textShadowColor: COLORS.magenta,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  scaleMarkWarn: {
    color: COLORS.orange,
  },
});
