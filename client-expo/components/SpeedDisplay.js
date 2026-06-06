/**
 * SpeedDisplay — Large digital KM/H readout (Premium)
 * 
 * Monospaced font, neon cyan glow, scanline overlay,
 * inner-shadow digit boxes. Fully responsive.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp, CARD_STYLE } from '../theme';

// Scanline overlay — subtle horizontal lines for CRT/LCD feel
function ScanlineOverlay() {
  const lines = [];
  for (let i = 0; i < 8; i++) {
    lines.push(
      <View
        key={i}
        style={[styles.scanline, { top: `${(i + 1) * 11}%` }]}
      />
    );
  }
  return <View style={styles.scanlineContainer}>{lines}</View>;
}

export default function SpeedDisplay({ speed }) {
  const displaySpeed = Math.round(Math.abs(speed));
  const speedStr = String(displaySpeed).padStart(3, '0');
  const speedPercent = Math.min((displaySpeed / 350) * 100, 100);
  const isHighSpeed = displaySpeed > 200;

  return (
    <View style={styles.container}>
      {/* Top accent line */}
      <View style={styles.accentLine} />

      <View style={styles.labelRow}>
        <Text style={styles.labelJp}>速度</Text>
        <Text style={styles.labelEn}>SPEED</Text>
      </View>

      <View style={styles.speedRow}>
        {speedStr.split('').map((digit, i) => {
          const isLeadingZero = i < speedStr.length - String(displaySpeed).length;
          return (
            <View key={i} style={[
              styles.digitBox,
              !isLeadingZero && styles.digitBoxActive,
            ]}>
              <Text style={[
                styles.digit,
                isLeadingZero && styles.digitDim,
                isHighSpeed && !isLeadingZero && styles.digitHighSpeed,
              ]}>
                {digit}
              </Text>
              {/* Inner shadow overlay */}
              <View style={styles.digitInnerShadow} />
            </View>
          );
        })}
      </View>

      <Text style={styles.unit}>KM/H</Text>

      {/* Speed bar visualization */}
      <View style={styles.speedBarBg}>
        <View style={[
          styles.speedBarFill,
          { width: `${speedPercent}%` },
          isHighSpeed && styles.speedBarFillHigh,
        ]} />
        {/* Speed bar glow */}
        <View style={[
          styles.speedBarGlow,
          { width: `${speedPercent}%` },
          isHighSpeed && { shadowColor: COLORS.magenta },
        ]} />
      </View>

      {/* Scanline CRT effect */}
      <ScanlineOverlay />
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
  labelRow: {
    alignItems: 'center',
    marginBottom: hp(2),
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
  speedRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  digitBox: {
    backgroundColor: COLORS.bgInner,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: wp(5),
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    minWidth: wp(30),
    alignItems: 'center',
    overflow: 'hidden',
  },
  digitBoxActive: {
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  digit: {
    fontFamily: MONO_FONT,
    fontSize: fp(34),
    color: COLORS.cyan,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  digitDim: {
    color: COLORS.cyanDark,
    textShadowRadius: 0,
  },
  digitHighSpeed: {
    color: COLORS.magentaLight,
    textShadowColor: COLORS.magenta,
    textShadowRadius: 18,
  },
  digitInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  unit: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.textDim,
    letterSpacing: 4,
    marginTop: hp(3),
  },
  speedBarBg: {
    width: '100%',
    height: hp(4),
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(3),
    marginTop: hp(6),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: wp(3),
  },
  speedBarFillHigh: {
    backgroundColor: COLORS.magenta,
  },
  speedBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // Scanline CRT effect
  scanlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
});
