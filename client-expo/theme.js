/**
 * JDM Theme Constants — Premium Edition
 * 
 * Shared design tokens for the Forza 6 telemetry dashboard.
 * 90s/00s Japanese Domestic Market aesthetic with modern depth.
 * 
 * Includes responsive scaling utilities for any screen size.
 */

import { Platform, Dimensions } from 'react-native';

// ─── Responsive Scaling ─────────────────────────────────
// Base design: 812 x 375 (iPhone X landscape)
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BASE_W = 812;
const BASE_H = 375;

// Scale horizontally and vertically
export const wp = (px) => (px / BASE_W) * SCREEN_W;
export const hp = (px) => (px / BASE_H) * SCREEN_H;
// Font scaling: uses the smaller axis for safe sizing
export const fp = (px) => Math.round((px / BASE_H) * Math.min(SCREEN_W, SCREEN_H));

// ─── Colors ─────────────────────────────────────────────
// Deep Dark Asphalt base with richer neon accents
export const COLORS = {
  // Backgrounds
  bg:          '#060608',
  bgCard:      '#0C0C10',
  bgCardHover: '#101018',
  bgInner:     '#08080C',
  bgOverlay:   'rgba(6, 6, 8, 0.92)',

  // Primary neon accents
  cyan:        '#00F0FF',
  cyanLight:   '#66F7FF',
  cyanMid:     '#00B8C4',
  cyanDim:     '#004D52',
  cyanDark:    '#002A2E',
  cyanBgDim:   '#001214',
  cyanGlow:    'rgba(0, 240, 255, 0.15)',

  // Danger / redline
  magenta:     '#FF00E5',
  magentaLight:'#FF66EE',
  magentaDim:  '#4D0044',
  magentaDark: '#220020',
  magentaGlow: 'rgba(255, 0, 229, 0.15)',

  // Warning
  orange:      '#FF7A1A',
  orangeLight: '#FFB366',
  orangeDark:  '#1A0E00',
  orangeGlow:  'rgba(255, 122, 26, 0.12)',

  // Status
  green:       '#00FF6A',
  greenDim:    '#003D1A',
  red:         '#FF2D2D',
  redDim:      '#3D0000',

  // Text
  textPrimary: '#E8E8EC',
  textSecondary: '#9898A0',
  textDim:     '#505058',
  textDark:    '#303038',

  // Borders & structure
  border:      '#1A1A22',
  borderLight: '#2A2A34',
  borderGlow:  'rgba(0, 240, 255, 0.08)',

  // Glassmorphism
  glass:       'rgba(12, 12, 18, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.04)',
};

// ─── Spacing Scale ──────────────────────────────────────
export const SPACING = {
  xs:  wp(4),
  sm:  wp(6),
  md:  wp(10),
  lg:  wp(16),
  xl:  wp(24),
  xxl: wp(32),
};

// ─── Shadow Presets ─────────────────────────────────────
export const SHADOWS = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  }),
  neon: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  }),
};

// ─── Timing Constants ───────────────────────────────────
export const TIMING = {
  fast:    80,
  normal:  180,
  smooth:  300,
  slow:    500,
};

// ─── Typography ─────────────────────────────────────────
// Monospaced digital feel — platform-native fallback
export const MONO_FONT = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

// ─── Card Style Mixin ───────────────────────────────────
export const CARD_STYLE = {
  backgroundColor: COLORS.bgCard,
  borderRadius: wp(10),
  borderWidth: 1,
  borderColor: COLORS.border,
  ...SHADOWS.subtle,
};

// ─── Glass Card Mixin ───────────────────────────────────
export const GLASS_CARD = {
  backgroundColor: COLORS.glass,
  borderRadius: wp(12),
  borderWidth: 1,
  borderColor: COLORS.glassBorder,
  ...SHADOWS.medium,
};
