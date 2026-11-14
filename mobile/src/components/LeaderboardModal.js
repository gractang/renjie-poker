import { useCallback, useEffect, useState } from "react";
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { fetchAppConfig, fetchLeaderboard } from "../lib/accountData";
import { formatPercent } from "../lib/format";

export default function LeaderboardModal({ visible, onClose, currentUserId }) {
  const { colors } = useTheme();
  const [rows, setRows] = useState([]);
  const [minHands, setMinHands] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [config, data] = await Promise.all([fetchAppConfig(), fetchLeaderboard()]);
      setMinHands(config.leaderboardMinHands);
      setRows(data);
    } catch (err) {
      setError(err.message ?? "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const renderBody = () => {
    if (error) return <Text style={[styles.message, { color: colors.textMuted }]}>{error}</Text>;
    if (loading && rows.length === 0) {
      return <Text style={[styles.message, { color: colors.textMuted }]}>Loading leaderboard...</Text>;
    }
    if (rows.length === 0) {
      return <Text style={[styles.message, { color: colors.textMuted }]}>No public leaderboard entries yet.</Text>;
    }

    return (
      <View style={[styles.table, { borderColor: colors.border }]}>
        <View style={[styles.tableRow, styles.tableHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headCell, styles.rankCol, { color: colors.textMuted }]}>RANK</Text>
          <Text style={[styles.headCell, styles.playerCol, { color: colors.textMuted }]}>PLAYER</Text>
          <Text style={[styles.headCell, styles.numCol, { color: colors.textMuted }]}>WIN %</Text>
          <Text style={[styles.headCell, styles.numCol, { color: colors.textMuted }]}>HANDS</Text>
        </View>
        {rows.map((row, index) => {
          const isMe = row.user_id === currentUserId;
          return (
            <View
              key={row.user_id}
              style={[
                styles.tableRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: isMe ? colors.accentBg : colors.surface,
                },
                index === rows.length - 1 && styles.lastRow,
              ]}
            >
              <Text style={[styles.cell, styles.rankCol, { color: colors.textMuted }]}>#{index + 1}</Text>
              <Text style={[styles.cell, styles.playerCol, { color: colors.text }]} numberOfLines={1}>
                {row.display_name || "anonymous"}
                {isMe ? <Text style={{ color: colors.accent }}>  you</Text> : null}
              </Text>
              <Text style={[styles.cell, styles.numCol, { color: colors.text }]}>{formatPercent(row.win_rate_pct)}</Text>
              <Text style={[styles.cell, styles.numCol, { color: colors.text }]}>{row.completed_hands}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.text }]}>close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyInner}
          refreshControl={<RefreshControl refreshing={loading && rows.length > 0} onRefresh={load} />}
        >
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Public top table</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {typeof minHands === "number"
                ? `Players who opted in with at least ${minHands} completed hands.`
                : "Players who opted in and met the hand minimum."}
            </Text>
          </View>
          {renderBody()}
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
  title: { fontSize: 18, fontWeight: "500", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  message: { fontSize: 13 },
  table: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHead: { paddingVertical: 8 },
  lastRow: { borderBottomWidth: 0 },
  headCell: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, fontFamily: "monospace" },
  cell: { fontSize: 14 },
  rankCol: { width: 48 },
  playerCol: { flex: 1, paddingRight: 8 },
  numCol: { width: 64, textAlign: "right" },
});
