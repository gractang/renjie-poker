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
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../hooks/useTheme";

const PRIVACY_POLICY_URL = "https://www.pickem-poker.com/privacy.html";

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
            <Text style={[styles.title, { color: colors.textMuted }]}>SETTINGS</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
            <AccountRow label={accountLabel} detail={accountDetail} onPress={() => closeThen(onOpenAccount)} colors={colors} />
            <AccountRow
              label="Leaderboard"
              detail="Top players by win rate"
              onPress={() => closeThen(onOpenLeaderboard)}
              colors={colors}
            />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DISPLAY</Text>
            <SettingRow label="Dark mode" value={isDark} onValueChange={toggle} colors={colors} />
            <SettingRow
              label="Four-color deck"
              description="Clubs green, diamonds blue"
              value={fourColor}
              onValueChange={toggleFourColor}
              colors={colors}
            />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ABOUT</Text>
            <AccountRow
              label="Privacy policy"
              onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
              colors={colors}
            />
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
  chevron: {
    fontSize: 22,
    fontWeight: "300",
  },
  rowDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});
