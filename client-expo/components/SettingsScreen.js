/**
 * SettingsScreen — Glassmorphic configuration modal
 * 
 * Allows user to configure:
 *   - WebSocket Server URL (PC running the bridge)
 *   - UDP Port (for Forza Data Out)
 * 
 * Persists settings via AsyncStorage.
 * Premium JDM-styled with animated slide-up + glassmorphism.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, MONO_FONT, SHADOWS, SPACING, wp, hp, fp, GLASS_CARD } from '../theme';

const STORAGE_KEY_URL = '@forza_server_url';
const STORAGE_KEY_PORT = '@forza_udp_port';
const DEFAULT_URL = 'http://192.168.1.100:4000';
const DEFAULT_PORT = '5300';

// ─── Utility: Load Settings ─────────────────────────────
export async function loadSettings() {
  try {
    const [url, port] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_URL),
      AsyncStorage.getItem(STORAGE_KEY_PORT),
    ]);
    return {
      serverUrl: url || DEFAULT_URL,
      udpPort: port || DEFAULT_PORT,
    };
  } catch {
    return { serverUrl: DEFAULT_URL, udpPort: DEFAULT_PORT };
  }
}

// ─── Section Header ─────────────────────────────────────
function SectionLabel({ jp, en }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionJp}>{jp}</Text>
      <Text style={styles.sectionEn}>{en}</Text>
    </View>
  );
}

// ─── Input Field ─────────────────────────────────────────
function SettingsInput({ label, labelJp, value, onChangeText, placeholder, keyboardType }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabelJp}>{labelJp}</Text>
        <Text style={styles.inputLabelEn}>{label}</Text>
      </View>
      <View style={[
        styles.inputContainer,
        focused && styles.inputContainerFocused,
      ]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDark}
          selectionColor={COLORS.cyan}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function SettingsScreen({ visible, onClose, onSave, currentUrl, currentPort }) {
  const [serverUrl, setServerUrl] = useState(currentUrl || DEFAULT_URL);
  const [udpPort, setUdpPort] = useState(currentPort || DEFAULT_PORT);
  const [saveStatus, setSaveStatus] = useState('');

  const slideY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setServerUrl(currentUrl || DEFAULT_URL);
      setUdpPort(currentPort || DEFAULT_PORT);
      setSaveStatus('');
      opacity.value = withTiming(1, { duration: 200 });
      slideY.value = withSpring(0, { damping: 18, stiffness: 140 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      slideY.value = withTiming(100, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleSave = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_URL, serverUrl),
        AsyncStorage.setItem(STORAGE_KEY_PORT, udpPort),
      ]);
      setSaveStatus('SAVED ✓');
      onSave(serverUrl, udpPort);
      setTimeout(() => onClose(), 600);
    } catch {
      setSaveStatus('ERROR');
    }
  };

  const handleReset = () => {
    setServerUrl(DEFAULT_URL);
    setUdpPort(DEFAULT_PORT);
    setSaveStatus('');
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalRoot}
      >
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.cardOuter, cardStyle]}>
          {/* Glow border effect */}
          <View style={styles.glowBorder}>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>設定</Text>
                  <Text style={styles.headerSubtitle}>SETTINGS</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Server URL */}
              <SectionLabel jp="接続設定" en="CONNECTION" />
              <SettingsInput
                label="SERVER URL"
                labelJp="サーバー"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.100:4000"
                keyboardType="url"
              />

              {/* UDP Port */}
              <SettingsInput
                label="UDP PORT"
                labelJp="ポート"
                value={udpPort}
                onChangeText={setUdpPort}
                placeholder="5300"
                keyboardType="number-pad"
              />

              {/* Help text */}
              <View style={styles.helpBox}>
                <Text style={styles.helpTitle}>FORZA データ設定</Text>
                <Text style={styles.helpText}>
                  1. Forza → HUD & Gameplay → Data Out{'\n'}
                  2. Set IP to your PC's address{'\n'}
                  3. Set Port to match UDP PORT above{'\n'}
                  4. Format: "Car Dash"
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>RESET</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                  <View style={styles.saveBtnInner}>
                    <Text style={styles.saveBtnText}>
                      {saveStatus || '保存  SAVE'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  overlayTouch: {
    flex: 1,
  },
  cardOuter: {
    position: 'absolute',
    width: '85%',
    maxWidth: 480,
    maxHeight: '90%',
  },
  glowBorder: {
    borderRadius: wp(14),
    padding: 1,
    backgroundColor: COLORS.borderGlow,
    ...SHADOWS.glow(COLORS.cyan),
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: wp(13),
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: MONO_FONT,
    fontSize: fp(22),
    color: COLORS.cyan,
    letterSpacing: 6,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  headerSubtitle: {
    fontFamily: MONO_FONT,
    fontSize: fp(9),
    color: COLORS.textDim,
    letterSpacing: 8,
    marginTop: 2,
  },
  closeBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: COLORS.bgInner,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: MONO_FONT,
    fontSize: fp(14),
    color: COLORS.textDim,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionJp: {
    fontFamily: MONO_FONT,
    fontSize: fp(9),
    color: COLORS.textDim,
  },
  sectionEn: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.cyanDim,
    letterSpacing: 4,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  inputLabelJp: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.textDim,
  },
  inputLabelEn: {
    fontFamily: MONO_FONT,
    fontSize: fp(7),
    color: COLORS.cyanDim,
    letterSpacing: 3,
  },
  inputContainer: {
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputContainerFocused: {
    borderColor: COLORS.cyanDim,
    ...SHADOWS.glow(COLORS.cyan),
  },
  textInput: {
    fontFamily: MONO_FONT,
    fontSize: fp(13),
    color: COLORS.cyan,
    letterSpacing: 1,
    padding: 0,
  },
  helpBox: {
    backgroundColor: COLORS.bgInner,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  helpTitle: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.orange,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  helpText: {
    fontFamily: MONO_FONT,
    fontSize: fp(8),
    color: COLORS.textDim,
    lineHeight: fp(14),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'flex-end',
  },
  resetBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgInner,
  },
  resetBtnText: {
    fontFamily: MONO_FONT,
    fontSize: fp(9),
    color: COLORS.textDim,
    letterSpacing: 3,
  },
  saveBtn: {
    borderRadius: wp(8),
    overflow: 'hidden',
  },
  saveBtnInner: {
    backgroundColor: COLORS.cyanDark,
    borderWidth: 1,
    borderColor: COLORS.cyanDim,
    borderRadius: wp(8),
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.glow(COLORS.cyan),
  },
  saveBtnText: {
    fontFamily: MONO_FONT,
    fontSize: fp(10),
    color: COLORS.cyan,
    letterSpacing: 3,
    textShadowColor: COLORS.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
