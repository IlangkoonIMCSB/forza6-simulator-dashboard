/**
 * TelemetryStrip — Secondary telemetry data bar (Premium)
 * 
 * Grouped card-within-card layout for data clusters.
 * Animated throttle/brake bars, pulsing fuel warning.
 * Fully responsive across screen sizes.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useEffect as useReanimatedEffect,
} from 'react-native-reanimated';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp } from '../theme';

function formatLapTime(seconds) {
  if (!seconds || seconds <= 0) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

// ─── Data Cell ───────────────────────────────────────────
function DataCell({ label, labelJp, value, unit, color = COLORS.cyan, small }) {
  return (
    <View style={[styles.cell, small && styles.cellSmall]}>
      <Text style={styles.cellLabelJp}>{labelJp}</Text>
      <View style={styles.cellValueRow}>
        <Text style={[
          styles.cellValue,
          small && styles.cellValueSmall,
          { color, textShadowColor: color },
        ]}>
          {value}
        </Text>
        {unit && <Text style={styles.cellUnit}>{unit}</Text>}
      </View>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

// ─── Input Bar (Throttle/Brake) ──────────────────────────
function InputBar({ label, value, color = COLORS.cyan }) {
  const percent = Math.round((value / 255) * 100);

  return (
    <View style={styles.inputBarContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputBarBg}>
        <View style={[
          styles.inputBarFill,
          {
            width: `${percent}%`,
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: percent > 50 ? 0.6 : 0.2,
            shadowRadius: percent > 50 ? 6 : 2,
          },
        ]} />
      </View>
      <Text style={[styles.inputPercent, { color }]}>{percent}%</Text>
    </View>
  );
}

// ─── Group Card ──────────────────────────────────────────
function GroupCard({ children, style }) {
  return (
    <View style={[styles.groupCard, style]}>
      {children}
    </View>
  );
}

export default function TelemetryStrip({
  boost,
  power,
  torque,
  accel,
  brake,
  fuel,
  lapNumber,
  bestLap,
  lastLap,
}) {
  const powerHP = Math.round(power / 745.7); // watts to HP
  const torqueNm = Math.round(torque);
  const boostPSI = (boost / 6894.76).toFixed(1); // Pa to PSI
  const fuelPercent = Math.round(fuel * 100);
  const fuelCritical = fuelPercent < 15;

  return (
    <View style={styles.container}>
      <View style={styles.dataRow}>
        {/* Engine Group */}
        <GroupCard>
          <View style={styles.groupRow}>
            <DataCell label="BOOST" labelJp="ブースト" value={boostPSI} unit="PSI" />
            <View style={styles.groupDivider} />
            <DataCell label="POWER" labelJp="馬力" value={powerHP} unit="HP" />
            <View style={styles.groupDivider} />
            <DataCell label="TORQUE" labelJp="トルク" value={torqueNm} unit="NM" />
          </View>
        </GroupCard>

        {/* Fuel */}
        <DataCell
          label="FUEL"
          labelJp="燃料"
          value={`${fuelPercent}%`}
          color={fuelCritical ? COLORS.magenta : COLORS.cyan}
        />

        {/* Main divider */}
        <View style={styles.separator} />

        {/* Input Group */}
        <GroupCard style={styles.inputGroupCard}>
          <InputBar label="THR" value={accel} color={COLORS.cyan} />
          <InputBar label="BRK" value={brake} color={COLORS.magenta} />
        </GroupCard>

        {/* Main divider */}
        <View style={styles.separator} />

        {/* Lap Group */}
        <GroupCard>
          <View style={styles.groupRow}>
            <DataCell label="LAP" labelJp="ラップ" value={lapNumber || '-'} small />
            <View style={styles.groupDivider} />
            <DataCell label="BEST" labelJp="最速" value={formatLapTime(bestLap)} small />
            <View style={styles.groupDivider} />
            <DataCell label="LAST" labelJp="前回" value={formatLapTime(lastLap)} small />
          </View>
        </GroupCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: hp(5),
    paddingHorizontal: wp(8),
    ...SHADOWS.subtle,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },

  // Group card (sub-card)
  groupCard: {
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(7),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: hp(4),
    paddingHorizontal: wp(8),
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  groupDivider: {
    width: 1,
    height: hp(22),
    backgroundColor: COLORS.border,
  },
  inputGroupCard: {
    minWidth: wp(90),
    gap: hp(3),
  },

  // Data cells
  cell: {
    alignItems: 'center',
    minWidth: wp(40),
  },
  cellSmall: {
    minWidth: wp(36),
  },
  cellLabelJp: {
    fontFamily: MONO_FONT,
    fontSize: fp(6),
    color: COLORS.textDark,
    letterSpacing: 1,
  },
  cellValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: wp(2),
  },
  cellValue: {
    fontFamily: MONO_FONT,
    fontSize: fp(13),
    color: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cellValueSmall: {
    fontSize: fp(11),
  },
  cellUnit: {
    fontFamily: MONO_FONT,
    fontSize: fp(6),
    color: COLORS.textDark,
  },
  cellLabel: {
    fontFamily: MONO_FONT,
    fontSize: fp(6),
    color: COLORS.textDim,
    letterSpacing: 2,
  },

  // Separators
  separator: {
    width: 1,
    height: hp(28),
    backgroundColor: COLORS.borderLight,
  },

  // Input bars
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  inputLabel: {
    fontFamily: MONO_FONT,
    fontSize: fp(7),
    color: COLORS.textDim,
    width: wp(18),
  },
  inputBarBg: {
    flex: 1,
    height: hp(6),
    backgroundColor: COLORS.bgCard,
    borderRadius: wp(3),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputBarFill: {
    height: '100%',
    borderRadius: wp(3),
    shadowOffset: { width: 0, height: 0 },
  },
  inputPercent: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    width: wp(24),
    textAlign: 'right',
  },
});
