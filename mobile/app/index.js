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
import { cardId, cardFromId } from "../src/lib/deck";
import { saveCompletedGameRecord, saveInProgressGame, fetchInProgressGame } from "../src/lib/accountData";
import HandRow from "../src/components/HandRow";
import SelectionControls from "../src/components/SelectionControls";
import SelectionGrid from "../src/components/SelectionGrid";
import RulesModal from "../src/components/RulesModal";
import AccountModal from "../src/components/AccountModal";
import LeaderboardOnboardingModal from "../src/components/LeaderboardOnboardingModal";

function ResultTag({ tag, colors }) {
  if (!tag) return null;
  const isWinner = tag === "winner";
  const bgColor = isWinner
    ? "rgba(45, 122, 79, 0.16)"
    : "rgba(192, 57, 43, 0.14)";
  const textColor = isWinner ? colors.winner : colors.loser;
  const borderColor = isWinner ? colors.winner : colors.loser;

  return (
    <View style={[styles.resultTag, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.resultTagText, { color: textColor }]}>{tag}</Text>
    </View>
  );
}

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

function reconstructGameState(session) {
  return {
    localGameId: session.metadata?.local_game_id,
    startedAt: session.started_at,
    deckOrder: session.deck_order.map(cardFromId),
    turnLog: session.metadata?.turn_log || [],
    player: (session.player_cards || []).map(cardFromId),
    dealer: (session.dealer_cards || []).map(cardFromId),
    remaining: (session.remaining_cards || []).map(cardFromId),
    gameOver: false,
    winner: null,
  };
}

export default function GameScreen() {
  const eng = useRenjiePokerEngine();
  const auth = useSupabaseAuth();
  const { colors, isDark, toggle } = useTheme();

  const {
    player, dealer, message, selection, remainingIds,
    winner, playerEval, dealerEval, gameOver, completedGameSummary,
  } = eng;

  const [showRules, setShowRules] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ state: "idle", message: "" });
  const [accountRefreshToken, setAccountRefreshToken] = useState(0);
  const [inProgressSessionId, setInProgressSessionId] = useState(null);
  const [restoringGame, setRestoringGame] = useState(false);
  const lastSyncedKeyRef = useRef(null);
  const syncingKeyRef = useRef(null);
  const lastSavedTurnCountRef = useRef(0);

  const hasActiveInProgress = Boolean(auth.user && inProgressSessionId && !gameOver);

  const handleDeal = useCallback(() => {
    eng.deal();
  }, [eng]);

  const handleNewGame = useCallback(() => {
    if (hasActiveInProgress) return;
    eng.reset();
    setSyncStatus({ state: "idle", message: "" });
    setInProgressSessionId(null);
    lastSyncedKeyRef.current = null;
    syncingKeyRef.current = null;
    lastSavedTurnCountRef.current = 0;
  }, [eng, hasActiveInProgress]);

  // Restore in-progress game on mount when signed in
  useEffect(() => {
    if (!auth.hasSupabaseConfig || auth.loading) return;
    if (!auth.user) {
      setRestoringGame(false);
      setInProgressSessionId(null);
      lastSavedTurnCountRef.current = 0;
      return;
    }

    let cancelled = false;
    setRestoringGame(true);

    fetchInProgressGame(auth.user.id)
      .then((session) => {
        if (cancelled) return;
        if (session) {
          const restoredState = reconstructGameState(session);
          eng.restoreGame(restoredState);
          setInProgressSessionId(session.id);
          lastSavedTurnCountRef.current = session.turns_played;
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoringGame(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.hasSupabaseConfig, auth.loading, auth.user?.id, eng.restoreGame]);

  // Save in-progress game after each deal
  useEffect(() => {
    if (!auth.user || !auth.hasSupabaseConfig) return;
    if (eng.gameOver) return;

    const turnCount = eng.turnLog.length;
    if (turnCount === 0 || turnCount <= lastSavedTurnCountRef.current) return;

    lastSavedTurnCountRef.current = turnCount;

    saveInProgressGame({
      userId: auth.user.id,
      game: {
        localGameId: eng.localGameId,
        startedAt: eng.startedAt,
        deckOrderIds: eng.deckOrder.map(cardId),
        playerCardIds: eng.player.map(cardId),
        dealerCardIds: eng.dealer.map(cardId),
        remainingCardIds: eng.remaining.map(cardId),
        turnLog: eng.turnLog,
        turnsPlayed: turnCount,
      },
    })
      .then((result) => setInProgressSessionId(result.id))
      .catch(() => {});
  }, [auth.user?.id, auth.hasSupabaseConfig, eng.turnLog.length, eng.gameOver, eng.localGameId, eng.startedAt, eng.deckOrder, eng.player, eng.dealer, eng.remaining, eng.turnLog]);

  // Save completed game with full sync status
  useEffect(() => {
    if (!completedGameSummary) {
      syncingKeyRef.current = null;
      setSyncStatus({ state: "idle", message: "" });
      return;
    }

    if (!auth.hasSupabaseConfig) return;

    if (!auth.user) {
      setSyncStatus({
        state: "guest",
        message: "Sign in to save this completed hand to your history.",
      });
      return;
    }

    const syncKey = `${auth.user.id}:${completedGameSummary.localGameId}`;

    if (lastSyncedKeyRef.current === syncKey || syncingKeyRef.current === syncKey) {
      return;
    }

    let cancelled = false;
    syncingKeyRef.current = syncKey;
    setSyncStatus({ state: "syncing", message: "Saving completed hand..." });

    saveCompletedGameRecord({
      userId: auth.user.id,
      summary: completedGameSummary,
    })
      .then(() => {
        if (cancelled) return;
        lastSyncedKeyRef.current = syncKey;
        syncingKeyRef.current = null;
        setInProgressSessionId(null);
        setAccountRefreshToken((v) => v + 1);
        setSyncStatus({
          state: "saved",
          message: "Last hand saved to your history.",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        syncingKeyRef.current = null;
        setSyncStatus({
          state: "error",
          message: error.message ?? "Could not save completed hand.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [auth.hasSupabaseConfig, auth.user, completedGameSummary]);

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
          <TouchableOpacity onPress={() => setShowRules(true)} style={[styles.headerBtn, { borderColor: colors.border }]}>
            <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAccount(true)}
            style={[styles.headerBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>
              {auth.user ? "profile" : "log in"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNewGame}
            disabled={hasActiveInProgress}
            style={[
              styles.headerBtn,
              { borderColor: colors.border },
              hasActiveInProgress && styles.disabled,
              !hasActiveInProgress && gameOver && { borderColor: colors.accent, backgroundColor: colors.accent },
            ]}
          >
            <Text style={[
              styles.headerBtnText,
              { color: colors.text },
              !hasActiveInProgress && gameOver && { color: colors.background },
            ]}>
              new game
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {(!gameOver) && (
          <Text style={[styles.message, { color: colors.textMuted }]}>
            {restoringGame ? "Resuming your previous hand..." : message}
          </Text>
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
              <View style={styles.handLabelRow}>
                <Text style={[styles.handLabel, { color: colors.textMuted }]}>PLAYER</Text>
                <ResultTag
                  tag={gameOver ? (winner === "player" ? "winner" : "loser") : null}
                  colors={colors}
                />
              </View>
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
              <View style={styles.handLabelRow}>
                <Text style={[styles.handLabel, { color: colors.textMuted }]}>DEALER</Text>
                <ResultTag
                  tag={gameOver ? (winner === "dealer" ? "winner" : "loser") : null}
                  colors={colors}
                />
              </View>
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

          {gameOver && (
            <View style={[styles.handCompleteNotice, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.handCompleteText, { color: colors.text }]}>
                Hand complete. Start a new game to select from the deck again.
              </Text>
            </View>
          )}

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

        {syncStatus.state !== "idle" && (
          <Text style={[
            styles.syncText,
            { color: syncStatus.state === "error" ? colors.error : colors.textMuted },
          ]}>
            {syncStatus.message}
          </Text>
        )}
      </ScrollView>

      <RulesModal visible={showRules} onClose={() => setShowRules(false)} />

      <AccountModal
        visible={showAccount}
        onClose={() => setShowAccount(false)}
        auth={auth}
        syncStatus={syncStatus}
        onRefresh={() => setAccountRefreshToken((v) => v + 1)}
      />

      <LeaderboardOnboardingModal
        visible={auth.isNewUser}
        auth={auth}
        onClose={auth.dismissNewUser}
      />
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
  handLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  resultTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultTagText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
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
  handCompleteNotice: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  handCompleteText: {
    fontSize: 11,
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
