import { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useRenjiePokerEngine from "../src/engine/useRenjiePokerEngine";
import useSupabaseAuth from "../src/hooks/useSupabaseAuth";
import { useTheme } from "../src/hooks/useTheme";
import { cardId } from "../src/lib/deck";
import { saveCompletedGameRecord } from "../src/lib/accountData";
import HandRow from "../src/components/HandRow";
import SelectionControls from "../src/components/SelectionControls";
import SelectionGrid from "../src/components/SelectionGrid";

function WinnerBanner({ winner, playerEval, dealerEval, colors }) {
  if (!winner || !playerEval || !dealerEval) return null;

  const isTie = playerEval.score === dealerEval.score;
  const isDealerWin = winner === "dealer";
  const label = winner === "player" ? "PLAYER WINS" : "DEALER WINS";
  const bannerBg = isDealerWin
    ? { backgroundColor: "rgba(192, 57, 43, 0.1)", borderColor: colors.loser }
    : { backgroundColor: "rgba(45, 122, 79, 0.1)", borderColor: colors.winner };
  const labelColor = isDealerWin ? colors.loser : colors.winner;

  return (
    <View style={[styles.banner, bannerBg]}>
      <View style={styles.bannerHeader}>
        <Text style={[styles.bannerLabel, { color: labelColor }]}>{label}</Text>
        {isTie && (
          <View style={[styles.tieBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.tieText, { color: colors.textMuted }]}>TIE BREAK: DEALER</Text>
          </View>
        )}
      </View>
      <Text style={[styles.bannerDetail, { color: colors.text }]}>
        Player: {playerEval.name}  ·  Dealer: {dealerEval.name}
      </Text>
    </View>
  );
}

export default function GameScreen() {
  const eng = useRenjiePokerEngine();
  const auth = useSupabaseAuth();
  const { colors, isDark, toggle } = useTheme();

  const {
    player, dealer, message, selection, remainingIds,
    winner, playerEval, dealerEval, gameOver, completedGameSummary,
  } = eng;

  const [syncStatus, setSyncStatus] = useState("idle");
  const lastSyncedKeyRef = useRef(null);

  const handleDeal = useCallback(() => {
    eng.deal();
  }, [eng]);

  const handleNewGame = useCallback(() => {
    eng.reset();
    setSyncStatus("idle");
    lastSyncedKeyRef.current = null;
  }, [eng]);

  // Save completed game
  useEffect(() => {
    if (!completedGameSummary || !auth.user || !auth.hasSupabaseConfig) return;

    const syncKey = `${auth.user.id}:${completedGameSummary.localGameId}`;
    if (lastSyncedKeyRef.current === syncKey) return;

    lastSyncedKeyRef.current = syncKey;
    setSyncStatus("syncing");

    saveCompletedGameRecord({ userId: auth.user.id, summary: completedGameSummary })
      .then(() => setSyncStatus("saved"))
      .catch(() => setSyncStatus("error"));
  }, [completedGameSummary, auth.user, auth.hasSupabaseConfig]);

  const selectionDisabled = gameOver;
  const canDeal = player.length < 5 && selection.size > 0 && !gameOver;
  const deckCount = remainingIds.size;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>pick'em poker</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggle} style={[styles.headerBtn, { borderColor: colors.border }]}>
            <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>
              {isDark ? "light" : "dark"}
            </Text>
          </TouchableOpacity>
          {auth.hasSupabaseConfig && !auth.user && (
            <TouchableOpacity
              onPress={auth.signInWithGoogle}
              style={[styles.headerBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>log in</Text>
            </TouchableOpacity>
          )}
          {auth.user && (
            <TouchableOpacity
              onPress={auth.signOut}
              style={[styles.headerBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>sign out</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNewGame}
            style={[
              styles.headerBtn,
              { borderColor: colors.border },
              gameOver && { borderColor: colors.accent, backgroundColor: colors.accent },
            ]}
          >
            <Text style={[
              styles.headerBtnText,
              { color: colors.text },
              gameOver && { color: colors.background },
            ]}>
              new game
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {!gameOver && (
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
        )}

        {gameOver && (
          <WinnerBanner
            winner={winner}
            playerEval={playerEval}
            dealerEval={dealerEval}
            colors={colors}
          />
        )}

        <View style={styles.handsContainer}>
          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <Text style={[styles.handLabel, { color: colors.textMuted }]}>PLAYER</Text>
              <View style={[styles.countBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {player.length}/5 CARDS
                </Text>
              </View>
            </View>
            {playerEval && (
              <Text style={[styles.handName, { color: colors.textMuted }]}>
                hand: {playerEval.name}
              </Text>
            )}
            <HandRow cards={player} />
          </View>

          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <Text style={[styles.handLabel, { color: colors.textMuted }]}>DEALER</Text>
              <View style={[styles.countBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {dealer.length} CARDS
                </Text>
              </View>
            </View>
            {dealerEval && (
              <Text style={[styles.handName, { color: colors.textMuted }]}>
                hand: {dealerEval.name}
              </Text>
            )}
            <HandRow
              cards={dealer}
              maxSlots={0}
              highlightIds={dealerEval?.bestFive}
            />
          </View>
        </View>

        {deckCount > 0 && (
          <View style={[styles.deckInfo, { borderColor: colors.border }]}>
            <Text style={[styles.deckLabel, { color: colors.textMuted }]}>DECK</Text>
            <Text style={[styles.deckCount, { color: colors.text }]}>{deckCount} live</Text>
          </View>
        )}

        <View style={[styles.selectionSection, { borderTopColor: colors.border }]}>
          <View style={styles.selectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SELECT FROM DECK</Text>
            <View style={[styles.countBadge, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.countText, { color: colors.text }]}>
                {selection.size} selected
              </Text>
            </View>
          </View>

          <SelectionControls
            remaining={eng.remaining}
            selection={selection}
            disabled={selectionDisabled}
            onSelectSuit={eng.selectSuit}
            onSelectRank={eng.selectRank}
            onSelectAll={eng.selectAll}
            onClearSelection={eng.clearSelection}
          />

          <TouchableOpacity
            onPress={handleDeal}
            disabled={!canDeal}
            activeOpacity={0.8}
            style={[
              styles.dealButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
              canDeal && { borderColor: colors.accent, backgroundColor: colors.accent },
              !canDeal && styles.disabled,
            ]}
          >
            <Text style={[
              styles.dealButtonText,
              { color: colors.text },
              canDeal && { color: "#fff" },
            ]}>
              Deal
            </Text>
          </TouchableOpacity>

          {!gameOver && (
            <SelectionGrid
              remainingIds={remainingIds}
              selection={selection}
              disabled={selectionDisabled}
              onToggle={eng.toggleSelect}
            />
          )}
        </View>

        {syncStatus === "saved" && (
          <Text style={[styles.syncText, { color: colors.textMuted }]}>
            Hand saved to history.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  message: {
    fontSize: 12,
    marginBottom: 12,
    fontFamily: "monospace",
  },
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  tieBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  tieText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  bannerDetail: {
    fontSize: 11,
    marginTop: 6,
    fontFamily: "monospace",
  },
  handsContainer: {
    gap: 20,
    marginBottom: 16,
  },
  handSection: {},
  handHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  handLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  handName: {
    fontSize: 11,
    marginBottom: 6,
    fontFamily: "monospace",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  deckInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  deckLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  deckCount: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  selectionSection: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  dealButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 12,
  },
  dealButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.4,
  },
  syncText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    fontFamily: "monospace",
  },
});
