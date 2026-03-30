import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchAppConfig, updateProfileSettings } from "../lib/accountData";
import { useTheme } from "../hooks/useTheme";

export default function LeaderboardOnboardingModal({ visible, auth, onClose }) {
  const { colors } = useTheme();
  const [leaderboardName, setLeaderboardName] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minHands, setMinHands] = useState(null);

  useEffect(() => {
    if (!visible) return;
    fetchAppConfig()
      .then((config) => setMinHands(config.leaderboardMinHands))
      .catch(() => {});
  }, [visible]);

  const handleSave = async () => {
    if (!auth.user) return;
    setSubmitting(true);
    try {
      await updateProfileSettings(auth.user.id, {
        displayName: auth.profile?.display_name ?? "",
        leaderboardName,
        leaderboardOptIn: optIn,
      });
      await auth.refreshProfile(auth.user);
      onClose();
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const minHandsLabel = typeof minHands === "number" ? `${minHands} completed hands` : "enough completed hands";
  const hasChanges = leaderboardName.trim() !== "" || optIn;
  const saveDisabled = submitting || (optIn && !leaderboardName.trim());

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome to Pick'em Poker</Text>

          <Text style={[styles.desc, { color: colors.textMuted }]}>
            Want to compete on the public leaderboard? Set a name and opt in below.
            You'll appear on the board once you reach {minHandsLabel}.
          </Text>

          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
            placeholder="leaderboard name"
            placeholderTextColor={colors.textMuted}
            value={leaderboardName}
            onChangeText={setLeaderboardName}
          />

          <View style={[styles.switchRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Show me on the public leaderboard</Text>
            <Switch
              value={optIn}
              onValueChange={setOptIn}
              trackColor={{ true: colors.accent }}
            />
          </View>

          {optIn && !leaderboardName.trim() && (
            <Text style={[styles.validationMsg, { color: colors.error }]}>
              A leaderboard name is required to opt in.
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saveDisabled}
              style={[
                styles.saveBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
                hasChanges && !saveDisabled && { borderColor: colors.accent, backgroundColor: colors.accent },
                saveDisabled && styles.disabled,
              ]}
            >
              <Text style={[
                styles.saveBtnText,
                { color: colors.text },
                hasChanges && !saveDisabled && { color: "#fff" },
              ]}>
                {optIn ? "save & opt in" : "save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              style={[styles.skipBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.skipBtnText, { color: colors.text }]}>skip</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, { color: colors.textMuted }]}>
            You can change this anytime from your profile.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  validationMsg: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  saveBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  skipBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
