/**
 * GearIndicator — Large center gear number (Premium)
 * 
 * Shows R for reverse, N for neutral, 1-10 for forward gears.
 * Ambient glow ring that changes with RPM zone.
 * Enhanced shift flash animation. Fully responsive.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp, CARD_STYLE } from '../theme';

export default function GearIndicator({ gear, isRedline }) {
  const flash = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  const gearLabel = gear === 0 ? 'R' : gear === 11 ? 'N' : String(gear);

  // Flash animation on gear change
  useEffect(() => {
    flash.value = withSequence(
      withTiming(1.2, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(0.95, { duration: 80, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }),
    );
  }, [gear]);

  // Glow ring pulse based on redline
  useEffect(() => {
    glowIntensity.value = withTiming(isRedline ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isRedline]);

  const animatedGearStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flash.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    borderColor: isRedline ? COLORS.magentaDim : COLORS.cyanDark,
    shadowColor: isRedline ? COLORS.magenta : COLORS.cyan,
    shadowOpacity: 0.15 + glowIntensity.value * 0.45,
    shadowRadius: 8 + glowIntensity.value * 16,
  }));

  const glowColor = isRedline ? COLORS.magenta : COLORS.cyan;

  return (
    <View style={styles.container}>
      {/* Top accent */}
      <View style={[styles.accentLine, isRedline && styles.accentLineRedline]} />

      <View style={styles.labelRow}>
        <Text style={styles.labelJp}>ギア</Text>
        <Text style={styles.labelEn}>GEAR</Text>
      </View>

      {/* Ambient glow ring */}
      <Animated.View style={[styles.glowRing, animatedGlowStyle]}>
        {/* Gear box */}
        <Animated.View style={[styles.gearBox, animatedGearStyle]}>
          <Text style={[
            styles.gearText,
            {
              color: glowColor,
              textShadowColor: glowColor,
            },
            isRedline && styles.gearTextRedline,
          ]}>
            {gearLabel}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Gear position dots */}
      <View style={styles.gearDots}>
        {[1, 2, 3, 4, 5, 6].map((g) => (
          <View key={g} style={styles.dotOuter}>
            <View
              style={[
                styles.dot,
                gear === g && {
                  backgroundColor: glowColor,
                  ...SHADOWS.glow(glowColor),
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CARD_STYLE,
    padding: wp(10),
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
  accentLineRedline: {
    backgroundColor: COLORS.magentaDim,
    shadowColor: COLORS.magenta,
  },
  labelRow: {
    alignItems: 'center',
    marginBottom: hp(3),
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
  glowRing: {
    width: wp(68),
    height: wp(68),
    borderRadius: wp(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  gearBox: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgInner,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  gearText: {
    fontFamily: MONO_FONT,
    fontSize: fp(38),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  gearTextRedline: {
    textShadowRadius: 30,
  },
  gearDots: {
    flexDirection: 'row',
    gap: wp(5),
    marginTop: hp(7),
  },
  dotOuter: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: COLORS.bgInner,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: COLORS.textDark,
  },
});
