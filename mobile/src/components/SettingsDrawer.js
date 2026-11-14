import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useTheme } from "../hooks/useTheme";

const PRIVACY_POLICY_URL = "https://www.pickem-poker.com/privacy.html";
const APP_VERSION = Constants.expoConfig?.version;

const DRAWER_WIDTH = 280;
const ANIMATION_MS = 220;

function SettingRow({ label, description, value, onValueChange, colors }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.rowDescription, { color: colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.border }}
      />
    </View>
  );
}

function SunIcon({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  );
}

function MoonIcon({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Svg>
  );
}

function ThemeRow({ isDark, onSelect, colors }) {
  const options = [
    { dark: false, label: "Light", Icon: SunIcon },
    { dark: true, label: "Dark", Icon: MoonIcon },
  ];

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, styles.rowText, { color: colors.text }]}>Theme</Text>
      <View style={[styles.segment, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {options.map(({ dark, label, Icon }) => {
          const selected = dark === isDark;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => onSelect(dark)}
              accessibilityRole="button"
              accessibilityLabel={`${label} mode`}
              accessibilityState={{ selected }}
              style={[styles.segmentBtn, selected && { backgroundColor: colors.accentBg }]}
            >
              <Icon color={selected ? colors.accent : colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function AccountRow({ label, detail, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {detail ? (
          <Text style={[styles.rowDescription, { color: colors.textMuted }]} numberOfLines={1}>{detail}</Text>
        ) : null}
      </View>
      <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsDrawer({
  visible,
  onClose,
  accountLabel,
  accountDetail,
  onOpenAccount,
  onOpenLeaderboard,
  onOpenRules,
}) {
  const { colors, isDark, toggle, fourColor, toggleFourColor } = useTheme();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const afterClose = useRef(null);

  const runAfterClose = () => {
    const action = afterClose.current;
    afterClose.current = null;
    action?.();
  };

  // iOS can't present another modal until this one has fully dismissed.
  const closeThen = (action) => {
    afterClose.current = action;
    onClose();
  };

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: ANIMATION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        if (Platform.OS !== "ios") runAfterClose();
      }
    });
  }, [visible, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onDismiss={runAfterClose}
    >
      {/* A Modal renders outside the app's provider, so it needs its own to get safe-area insets. */}
      <SafeAreaProvider>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close settings" />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: colors.background, borderRightColor: colors.border, transform: [{ translateX }] },
        ]}
      >
        <SafeAreaView style={styles.drawerInner}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textMuted }]}>MENU</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
            <AccountRow label={accountLabel} detail={accountDetail} onPress={() => closeThen(onOpenAccount)} colors={colors} />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>GAME</Text>
            <AccountRow label="How to play" onPress={() => closeThen(onOpenRules)} colors={colors} />
            <AccountRow
              label="Leaderboard"
              detail="Top players by win rate"
              onPress={() => closeThen(onOpenLeaderboard)}
              colors={colors}
            />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DISPLAY</Text>
            <ThemeRow isDark={isDark} onSelect={(dark) => dark !== isDark && toggle()} colors={colors} />
            <SettingRow
              label="Four-color deck"
              description="Clubs green, diamonds blue"
              value={fourColor}
              onValueChange={toggleFourColor}
              colors={colors}
            />
          </View>
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
              hitSlop={8}
            >
              <Text style={[styles.footerText, styles.footerLink, { color: colors.textMuted }]}>Privacy policy</Text>
            </TouchableOpacity>
            {APP_VERSION ? (
              <Text style={[styles.footerText, { color: colors.textMuted }]}>v{APP_VERSION}</Text>
            ) : null}
          </View>
        </SafeAreaView>
      </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
  },
  drawerInner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 2,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
  },
  footerLink: {
    textDecorationLine: "underline",
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    width: 40,
    height: 32,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
  },
  rowDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});
