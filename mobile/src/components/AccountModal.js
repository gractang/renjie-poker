import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  clearCompletedHistory,
  EMPTY_STATS,
  fetchAccountSnapshot,
  fetchAppConfig,
  updateProfileSettings,
} from "../lib/accountData";
import { formatCategory, formatPercent } from "../lib/format";
import { useTheme } from "../hooks/useTheme";

function SectionEyebrow({ text, colors }) {
  return (
    <Text style={[styles.eyebrow, { color: colors.textMuted }]}>{text}</Text>
  );
}

function StatCard({ label, value, detail, colors }) {
  return (
    <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {detail ? <Text style={[styles.statDetail, { color: colors.textMuted }]}>{detail}</Text> : null}
    </View>
  );
}

function HistoryRow({ row, colors }) {
  const won = row.outcome === "win";
  const isLoss = !won && !row.dealer_won_tie;
  const outcomeLabel = won ? "win" : row.dealer_won_tie ? "dealer tie" : "loss";
  const outcomeColor = won ? colors.winner : isLoss ? colors.loser : colors.textMuted;
  const outcomeBorder = won ? colors.winner : isLoss ? colors.loser : colors.border;

  return (
    <View style={[styles.historyRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.historyRowTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.historyHands, { color: colors.text }]}>
            {row.player_hand_name}
            <Text style={{ color: colors.textMuted }}> vs {row.dealer_hand_name}</Text>
          </Text>
          <Text style={[styles.historyDate, { color: colors.textMuted }]}>
            {row.completed_at ? new Date(row.completed_at).toLocaleString() : ""}
          </Text>
        </View>
        <View style={[styles.outcomeBadge, { borderColor: outcomeBorder }]}>
          <Text style={[styles.outcomeText, { color: outcomeColor }]}>{outcomeLabel}</Text>
        </View>
      </View>
      <View style={styles.historyMeta}>
        <Text style={[styles.historyMetaText, { color: colors.textMuted }]}>
          {formatCategory(row.player_hand_category || "")} · {row.turns_played} turns
        </Text>
      </View>
    </View>
  );
}

export default function AccountModal({ visible, onClose, auth, syncStatus, onRefresh }) {
  const { colors } = useTheme();

  const [localMessage, setLocalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [rank, setRank] = useState(null);
  const [leaderboardMinHands, setLeaderboardMinHands] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    displayName: "",
    leaderboardName: "",
    leaderboardOptIn: false,
  });

  const hasLeaderboardConfig = typeof leaderboardMinHands === "number";
  const leaderboardEligible = hasLeaderboardConfig && stats.completedHands >= leaderboardMinHands;
  const leaderboardProgress = hasLeaderboardConfig
    ? Math.min(100, Math.round((stats.completedHands / leaderboardMinHands) * 100))
    : 0;
  const leaderboardRequirementLabel = hasLeaderboardConfig
    ? `${leaderboardMinHands} completed hands`
    : "the configured completed-hand requirement";

  useEffect(() => {
    setProfileDraft({
      displayName: auth.profile?.display_name ?? "",
      leaderboardName: auth.profile?.leaderboard_name ?? "",
      leaderboardOptIn: Boolean(auth.profile?.leaderboard_opt_in),
    });
  }, [auth.profile]);

  const loadDashboard = useCallback(async () => {
    if (!visible || !auth.hasSupabaseConfig) return;

    setDashboardLoading(true);
    setDashboardError("");

    try {
      if (auth.user) {
        const [config, snapshot] = await Promise.all([
          fetchAppConfig(),
          fetchAccountSnapshot(auth.user.id),
        ]);
        setLeaderboardMinHands(config.leaderboardMinHands);
        setHistory(snapshot.history);
        setStats(snapshot.stats);
        setRank(snapshot.rank);
      } else {
        const config = await fetchAppConfig();
        setLeaderboardMinHands(config.leaderboardMinHands);
        setHistory([]);
        setStats(EMPTY_STATS);
        setRank(null);
      }
    } catch (error) {
      setDashboardError(error.message ?? "Could not load account data.");
    } finally {
      setDashboardLoading(false);
    }
  }, [auth.hasSupabaseConfig, auth.user, visible]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const topHands = useMemo(() => stats.handBreakdown.slice(0, 5), [stats.handBreakdown]);

  const handleGoogle = async () => {
    setSubmitting(true);
    setLocalMessage("");
    try {
      await auth.signInWithGoogle();
    } catch (error) {
      setLocalMessage(error.message ?? "Could not start Google sign-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async () => {
    if (!auth.user) return;
    setSubmitting(true);
    setLocalMessage("");
    try {
      const nextProfile = await updateProfileSettings(auth.user.id, profileDraft);
      await auth.refreshProfile(auth.user);
      setProfileDraft({
        displayName: nextProfile.display_name ?? "",
        leaderboardName: nextProfile.leaderboard_name ?? "",
        leaderboardOptIn: Boolean(nextProfile.leaderboard_opt_in),
      });
      setLocalMessage("Profile updated.");
      setEditingProfile(false);
      await loadDashboard();
    } catch (error) {
      setLocalMessage(error.message ?? "Could not save profile settings.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileDraft({
      displayName: auth.profile?.display_name ?? "",
      leaderboardName: auth.profile?.leaderboard_name ?? "",
      leaderboardOptIn: Boolean(auth.profile?.leaderboard_opt_in),
    });
    setEditingProfile(false);
  };

  const handleClearHistory = () => {
    if (!auth.user || !hasLeaderboardConfig || clearingHistory) return;

    Alert.alert(
      "Clear History",
      `Are you sure? This will remove all past hands and your leaderboard standing. You'll need to re-qualify by playing ${leaderboardMinHands} hands.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setClearingHistory(true);
            setLocalMessage("");
            try {
              const result = await clearCompletedHistory(auth.user.id);
              if ((result?.clearedCount ?? 0) > 0) {
                setLocalMessage("History cleared.");
              } else {
                setLocalMessage("No completed hands to clear.");
              }
              await loadDashboard();
              if (onRefresh) onRefresh();
            } catch (error) {
              setLocalMessage(error.message ?? "Could not clear history.");
            } finally {
              setClearingHistory(false);
            }
          },
        },
      ]
    );
  };

  const hasChanges =
    profileDraft.displayName !== (auth.profile?.display_name ?? "") ||
    profileDraft.leaderboardName !== (auth.profile?.leaderboard_name ?? "") ||
    profileDraft.leaderboardOptIn !== Boolean(auth.profile?.leaderboard_opt_in);

  const saveDisabled = submitting || (profileDraft.leaderboardOptIn && !profileDraft.leaderboardName.trim());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {auth.user ? "Account & History" : "Sign In"}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.text }]}>close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
          {/* Not configured */}
          {!auth.hasSupabaseConfig && (
            <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <SectionEyebrow text="CONFIG" colors={colors} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Supabase keys are still missing</Text>
              <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
                Add the environment variables before auth, history, and leaderboard queries can work.
              </Text>
            </View>
          )}

          {/* Loading */}
          {auth.hasSupabaseConfig && auth.loading && (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading account state...</Text>
          )}

          {/* Signed out */}
          {auth.hasSupabaseConfig && !auth.loading && !auth.user && (
            <View style={styles.signedOutContainer}>
              <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <SectionEyebrow text="SAVE YOUR RUN" colors={colors} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Sign in before your hot streak disappears
                </Text>

                <View style={styles.featureCards}>
                  {[
                    { label: "HISTORY", desc: "Completed hands stay attached to your account." },
                    { label: "STATS", desc: "Win rate and hand frequency update from your saved sessions." },
                    { label: "LEADERBOARD", desc: `Opt in anytime. You'll appear after ${leaderboardRequirementLabel}.` },
                  ].map((item) => (
                    <View key={item.label} style={[styles.featureCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Text style={[styles.featureLabel, { color: colors.textMuted }]}>{item.label}</Text>
                      <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleGoogle}
                  disabled={submitting}
                  style={[styles.googleBtn, { backgroundColor: colors.text }]}
                >
                  <Text style={[styles.googleBtnText, { color: colors.background }]}>continue with google</Text>
                </TouchableOpacity>
              </View>

              {(localMessage || auth.error) ? (
                <Text style={[styles.messageText, { color: colors.textMuted }]}>
                  {localMessage || auth.error}
                </Text>
              ) : null}
            </View>
          )}

          {/* Signed in */}
          {auth.hasSupabaseConfig && !auth.loading && auth.user && (
            <View style={styles.signedInContainer}>
              {/* User info */}
              <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <SectionEyebrow text="SIGNED IN" colors={colors} />
                <View style={styles.userInfoRow}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {profileDraft.displayName || auth.user.email || "player"}
                  </Text>
                  {rank != null && (
                    <View style={[styles.rankBadge, { borderColor: colors.accent }]}>
                      <Text style={[styles.rankText, { color: colors.accent }]}>#{rank}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userEmail, { color: colors.textMuted }]}>{auth.user.email}</Text>

                {syncStatus?.message ? (
                  <Text style={[styles.syncMsg, { color: colors.textMuted }]}>{syncStatus.message}</Text>
                ) : null}

                <TouchableOpacity
                  onPress={auth.signOut}
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>sign out</Text>
                </TouchableOpacity>
              </View>

              {/* Profile */}
              <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <SectionEyebrow text="PROFILE" colors={colors} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity and public name</Text>
                  </View>
                  {!editingProfile && (
                    <TouchableOpacity
                      onPress={() => setEditingProfile(true)}
                      style={[styles.actionBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {editingProfile ? (
                  <View style={styles.editForm}>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                      placeholder="display name"
                      placeholderTextColor={colors.textMuted}
                      value={profileDraft.displayName}
                      onChangeText={(text) => setProfileDraft((prev) => ({ ...prev, displayName: text }))}
                    />
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                      placeholder="leaderboard name"
                      placeholderTextColor={colors.textMuted}
                      value={profileDraft.leaderboardName}
                      onChangeText={(text) => setProfileDraft((prev) => ({ ...prev, leaderboardName: text }))}
                    />
                    <View style={[styles.switchRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Text style={[styles.switchLabel, { color: colors.text }]}>Show me on the public leaderboard</Text>
                      <Switch
                        value={profileDraft.leaderboardOptIn}
                        onValueChange={(val) => setProfileDraft((prev) => ({ ...prev, leaderboardOptIn: val }))}
                        trackColor={{ true: colors.accent }}
                      />
                    </View>
                    {profileDraft.leaderboardOptIn && !profileDraft.leaderboardName.trim() && (
                      <Text style={[styles.validationMsg, { color: colors.error }]}>
                        A leaderboard name is required to opt in.
                      </Text>
                    )}
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        onPress={handleProfileSave}
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
                          save profile
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleProfileCancel}
                        disabled={submitting}
                        style={[styles.actionBtn, { borderColor: colors.border }]}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.profileFields}>
                    {[
                      { label: "display name", value: profileDraft.displayName },
                      { label: "leaderboard name", value: profileDraft.leaderboardName },
                      { label: "public leaderboard", value: profileDraft.leaderboardOptIn ? "opted in" : "not opted in" },
                    ].map((field) => (
                      <View key={field.label} style={[styles.profileField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={[styles.profileFieldLabel, { color: colors.textMuted }]}>{field.label}</Text>
                        <Text style={[styles.profileFieldValue, { color: field.value ? colors.text : colors.textMuted }]}>
                          {field.value || "not set"}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* History */}
              <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <SectionEyebrow text="HISTORY" colors={colors} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent completed hands</Text>

                {dashboardLoading ? (
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading history...</Text>
                ) : dashboardError ? (
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>{dashboardError}</Text>
                ) : history.length > 0 ? (
                  <View style={styles.historyList}>
                    {history.slice(0, 5).map((row) => (
                      <HistoryRow key={row.id} row={row} colors={colors} />
                    ))}
                    {history.length > 5 && (
                      <Text style={[styles.historyMore, { color: colors.textMuted }]}>
                        + {history.length - 5} more hands
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                      Finish a hand while signed in and it will land here automatically.
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <SectionEyebrow text="STATS" colors={colors} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>How your run looks so far</Text>

                <View style={styles.statsRow}>
                  <StatCard label="COMPLETED" value={stats.completedHands} colors={colors} />
                  <StatCard label="WIN RATE" value={formatPercent(stats.winRatePct)} colors={colors} />
                  <StatCard label="RECORD" value={`${stats.wins}-${stats.losses}`} detail="W-L" colors={colors} />
                </View>

                {/* Leaderboard progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: colors.text }]}>Leaderboard progress</Text>
                    <Text style={[styles.progressCount, { color: colors.textMuted }]}>
                      {hasLeaderboardConfig ? `${stats.completedHands}/${leaderboardMinHands}` : `${stats.completedHands}/...`}
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                    <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${leaderboardProgress}%` }]} />
                  </View>
                  <Text style={[styles.progressMsg, { color: colors.textMuted }]}>
                    {leaderboardEligible
                      ? profileDraft.leaderboardOptIn
                        ? "You're on the public leaderboard."
                        : "You have enough hands to appear on the leaderboard. Opt in from your profile."
                      : hasLeaderboardConfig
                        ? `${leaderboardMinHands - stats.completedHands} more completed hands to appear on the leaderboard.`
                        : "Leaderboard requirement is loading."}
                  </Text>
                </View>

                {/* Top hands */}
                <View style={styles.topHandsSection}>
                  <Text style={[styles.topHandsLabel, { color: colors.text }]}>Most common made hands</Text>
                  {topHands.length > 0 ? (
                    <View style={styles.topHandsList}>
                      {topHands.map((entry) => (
                        <View key={entry.category} style={[styles.handPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                          <Text style={[styles.handPillText, { color: colors.textMuted }]}>
                            {formatCategory(entry.category)} · {entry.count}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.topHandsEmpty, { color: colors.textMuted }]}>
                      Finish a few hands and your distribution will appear here.
                    </Text>
                  )}
                </View>

                {/* Clear history */}
                <TouchableOpacity
                  onPress={handleClearHistory}
                  disabled={clearingHistory || dashboardLoading || !hasLeaderboardConfig}
                  style={[
                    styles.clearBtn,
                    { borderColor: colors.error },
                    (clearingHistory || dashboardLoading || !hasLeaderboardConfig) && styles.disabled,
                  ]}
                >
                  <Text style={[styles.clearBtnText, { color: colors.error }]}>
                    {clearingHistory ? "clearing history..." : "clear history"}
                  </Text>
                </TouchableOpacity>
              </View>

              {(localMessage || auth.error) ? (
                <Text style={[styles.messageText, { color: colors.textMuted }]}>
                  {localMessage || auth.error}
                </Text>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  closeBtnText: { fontSize: 12, fontWeight: "500" },
  body: { flex: 1 },
  bodyInner: { padding: 16, paddingBottom: 40, gap: 16 },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 2, fontFamily: "monospace", marginBottom: 6 },
  section: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "500", letterSpacing: -0.3 },
  sectionDesc: { fontSize: 13, lineHeight: 20 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  loadingText: { fontSize: 13 },
  messageText: { fontSize: 13, textAlign: "center" },

  // Sign-out container
  signedOutContainer: { gap: 16 },
  featureCards: { gap: 8, marginTop: 8 },
  featureCard: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  featureLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, fontFamily: "monospace" },
  featureDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  googleBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  googleBtnText: { fontSize: 14, fontWeight: "600" },

  // Signed in
  signedInContainer: { gap: 16 },
  userInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { fontSize: 18, fontWeight: "500", letterSpacing: -0.3 },
  rankBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  rankText: { fontSize: 10, fontWeight: "600", letterSpacing: 1, fontFamily: "monospace" },
  userEmail: { fontSize: 13, marginTop: 2 },
  syncMsg: { fontSize: 12, marginTop: 6 },
  actionBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start", marginTop: 8 },
  actionBtnText: { fontSize: 12, fontWeight: "500" },

  // Profile edit
  editForm: { gap: 10, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10 },
  switchLabel: { fontSize: 13, flex: 1, marginRight: 12 },
  validationMsg: { fontSize: 12 },
  editActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  saveBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { fontSize: 14, fontWeight: "600" },

  // Profile display
  profileFields: { gap: 6, marginTop: 4 },
  profileField: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10 },
  profileFieldLabel: { fontSize: 13 },
  profileFieldValue: { fontSize: 13 },

  // History
  historyList: { gap: 8, marginTop: 4 },
  historyRow: { borderWidth: 1, borderRadius: 8, padding: 12 },
  historyRowTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  historyHands: { fontSize: 13 },
  historyDate: { fontSize: 11, marginTop: 4 },
  outcomeBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  outcomeText: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" },
  historyMeta: { marginTop: 8 },
  historyMetaText: { fontSize: 11 },
  historyMore: { fontSize: 12, textAlign: "center", marginTop: 4 },
  emptyState: { borderWidth: 1, borderStyle: "dashed", borderRadius: 8, padding: 16 },
  emptyStateText: { fontSize: 13 },

  // Stats
  statsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12 },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, fontFamily: "monospace" },
  statValue: { fontSize: 20, fontWeight: "500", marginTop: 6, letterSpacing: -0.5 },
  statDetail: { fontSize: 11, marginTop: 2 },

  // Progress
  progressSection: { marginTop: 8, gap: 6 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 13 },
  progressCount: { fontSize: 13 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressMsg: { fontSize: 12 },

  // Top hands
  topHandsSection: { marginTop: 8, gap: 6 },
  topHandsLabel: { fontSize: 13 },
  topHandsList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  handPill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  handPillText: { fontSize: 11 },
  topHandsEmpty: { fontSize: 12 },

  // Clear
  clearBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  clearBtnText: { fontSize: 13, fontWeight: "600" },

  disabled: { opacity: 0.4 },
});
