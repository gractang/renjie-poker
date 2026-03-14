import { useState, useRef, useEffect, useCallback } from "react";
import useRenjiePokerEngine from "../engine/useRenjiePokerEngine";
import useSupabaseAuth from "../hooks/useSupabaseAuth";
import { saveCompletedGameRecord, saveInProgressGame, fetchInProgressGame, updateProfileSettings, fetchAppConfig } from "../lib/accountData";
import { cardId, cardFromId, isRedSuit } from "../lib/deck";
import { evaluateBestHand } from "../lib/poker-eval";
import HandRow from "../components/HandRow";
import SelectionGrid from "../components/SelectionGrid";
import SelectionButtons from "../components/SelectionButtons";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import RulesContent from "../components/RulesContent";
import AccountModal from "../components/AccountModal";
import HistoryPage from "../components/HistoryPage";
import LeaderboardPage from "../components/LeaderboardPage";
import SiteFooter from "../components/SiteFooter";

const HAND_CARD_WIDTH = 48;
const HAND_CARD_HEIGHT = 64;
const HAND_CARD_GAP = 4;
const CARD_DELAY = 210;
const CARD_DURATION = 460;

function getHashRoute() {
  if (typeof window === "undefined") return "";

  const hash = window.location.hash.toLowerCase();

  if (hash === "#leaderboard") return "leaderboard";
  if (hash === "#history") return "history";

  return "";
}

function clearHashRoute() {
  if (typeof window === "undefined") return;

  window.history.pushState({}, "", `${window.location.pathname}${window.location.search}`);
}

function TrophyIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 5" />
      <path d="M17 6h3a3 3 0 0 1-3 5" />
    </svg>
  );
}

function UserIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function FlyingCard({ card, from, to, delay, duration, highlight = false }) {
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), delay);
    const t2 = setTimeout(() => setPhase("flying"), delay + 50);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [delay]);

  if (phase === "hidden") return null;

  const isFlying = phase === "flying";
  const pos = isFlying ? to : from;
  const red = isRedSuit(card);

  return (
    <div
      className={`card-display-theme text-sm ${highlight ? "ring-2 ring-[var(--color-selected)]" : ""}`}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 100,
        transition: isFlying
          ? `left ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), top ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${duration}ms ease`
          : "none",
        transform: isFlying ? "scale(1)" : "scale(1.12)",
        boxShadow: isFlying
          ? "0 1px 3px rgba(0,0,0,0.1)"
          : "0 8px 20px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }}
    >
      <span className={`font-medium ${red ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"}`}>
        {card.rank}
      </span>
      <span className={`ml-0.5 text-xs opacity-70 ${red ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"}`}>
        {card.suit}
      </span>
    </div>
  );
}

function HandHeader({ label, countLabel, handName, resultTag = null }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div
          className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {label}
        </div>
        {resultTag && (
          <div
            className={[
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]",
              resultTag === "winner"
                ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]"
                : "border-[var(--color-suit-red)] bg-[color-mix(in_srgb,var(--color-suit-red)_14%,transparent)] text-[var(--color-suit-red)]",
            ].join(" ")}
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {resultTag}
          </div>
        )}
        {handName && (
          <div
            className="text-[11px] text-[var(--color-text-muted)]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            hand: {handName}
          </div>
        )}
      </div>
      <div
        className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {countLabel}
      </div>
    </div>
  );
}

function WinnerBanner({ winner, playerEval, dealerEval }) {
  if (!winner || !playerEval || !dealerEval) return null;

  const isTie = playerEval.score === dealerEval.score;
  const isDealerWin = winner === "dealer";
  const winnerLabel = winner === "player" ? "Player wins" : "Dealer wins";
  const bannerToneClass = isDealerWin
    ? "border-[var(--color-suit-red)] bg-[color-mix(in_srgb,var(--color-suit-red)_12%,var(--color-surface))]"
    : "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))]";
  const winnerLabelClass = isDealerWin ? "text-[var(--color-suit-red)]" : "text-[var(--color-accent)]";

  return (
    <section
      aria-live="polite"
      className={`mb-4 rounded-[20px] border px-4 py-3 ${bannerToneClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={`text-sm uppercase tracking-[0.2em] ${winnerLabelClass}`}
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {winnerLabel}
        </div>
        {isTie && (
          <div
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            tie break: dealer
          </div>
        )}
      </div>
      <div
        className="mt-2 text-xs text-[var(--color-text)]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        player: {playerEval.name} &middot; dealer: {dealerEval.name}
      </div>
    </section>
  );
}

function FullScreenNotice({ title, message, onBack }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-4">
          <button className="btn-theme" onClick={onBack} type="button">
            &larr; back
          </button>
          <h1
            className="text-sm uppercase tracking-widest text-[var(--color-text-muted)]"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {title}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-6">
        <div className="w-full max-w-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 text-sm text-[var(--color-text-muted)]">
          {message}
        </div>
      </div>

      <SiteFooter className="border-t border-[var(--color-border)]" />
    </div>
  );
}

const ONBOARDING_INPUT_CLASS = "w-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]";

function LeaderboardOnboardingModal({ open, auth, onClose }) {
  const [leaderboardName, setLeaderboardName] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minHands, setMinHands] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetchAppConfig()
      .then((config) => setMinHands(config.leaderboardMinHands))
      .catch(() => {});
  }, [open]);

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
    <Modal open={open} onClose={onClose} title="Welcome to Renjie Poker">
      <div className="space-y-5">
        <div className="text-sm text-[var(--color-text-muted)]">
          Want to compete on the public leaderboard? Set a name and opt in below.
          You'll appear on the board once you reach {minHandsLabel}.
        </div>
        <div className="grid gap-3">
          <input
            className={ONBOARDING_INPUT_CLASS}
            placeholder="leaderboard name"
            value={leaderboardName}
            onChange={(e) => setLeaderboardName(e.target.value)}
          />
          <label className="flex items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
            <span>Show me on the public leaderboard</span>
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
            />
          </label>
          {optIn && !leaderboardName.trim() && (
            <div className="text-xs text-[var(--color-suit-red)]">A leaderboard name is required to opt in.</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-theme flex-1 justify-between px-4 py-3 ${hasChanges && !saveDisabled ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-background)]" : ""}`}
            disabled={saveDisabled}
            onClick={handleSave}
            type="button"
          >
            <span>{optIn ? "save & opt in" : "save"}</span>
            <span className="text-xs opacity-70">&rarr;</span>
          </button>
          <button
            className="btn-theme px-4 py-3"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            skip
          </button>
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          You can change this anytime from your profile.
        </div>
      </div>
    </Modal>
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

export default function App() {
  const eng = useRenjiePokerEngine();
  const {
    player,
    dealer,
    message,
    selection,
    remainingIds,
    winner,
    playerEval,
    dealerEval,
    gameOver,
    completedGameSummary,
  } = eng;
  const auth = useSupabaseAuth();

  const [showRules, setShowRules] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [route, setRoute] = useState(() => getHashRoute());
  const [accountRefreshToken, setAccountRefreshToken] = useState(0);
  const [syncStatus, setSyncStatus] = useState({ state: "idle", message: "" });
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [isSelectorOpen, setIsSelectorOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [buttonFlash, setButtonFlash] = useState({});
  const [flyingCards, setFlyingCards] = useState([]);
  const [isDealing, setIsDealing] = useState(false);
  const [pendingDeal, setPendingDeal] = useState(null);
  const [landedIds, setLandedIds] = useState(new Set());
  const [inProgressSessionId, setInProgressSessionId] = useState(null);
  const [restoringGame, setRestoringGame] = useState(false);

  const deckRef = useRef(null);
  const playerHandRef = useRef(null);
  const dealerHandRef = useRef(null);
  const commitTimeoutRef = useRef(null);
  const landingTimeoutsRef = useRef([]);
  const lastSyncedKeyRef = useRef(null);
  const syncingKeyRef = useRef(null);
  const lastSavedTurnCountRef = useRef(0);

  const clearPendingCommit = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }
    for (const t of landingTimeoutsRef.current) clearTimeout(t);
    landingTimeoutsRef.current = [];
  }, []);

  const getCardTarget = useCallback((handEl, slotIndex) => {
    const rowEl = handEl?.querySelector("[data-hand-row]");
    const sampleCardEl = handEl?.querySelector("[data-hand-card]");

    if (!rowEl) {
      return null;
    }

    const rowRect = rowEl.getBoundingClientRect();
    const cardRect = sampleCardEl?.getBoundingClientRect();
    const rowStyles = window.getComputedStyle(rowEl);
    const gapX = Number.parseFloat(rowStyles.columnGap || rowStyles.gap || `${HAND_CARD_GAP}`) || HAND_CARD_GAP;
    const gapY = Number.parseFloat(rowStyles.rowGap || rowStyles.gap || `${HAND_CARD_GAP}`) || HAND_CARD_GAP;
    const width = cardRect?.width || HAND_CARD_WIDTH;
    const height = cardRect?.height || HAND_CARD_HEIGHT;
    const wraps = rowEl.dataset.wrap === "true";

    if (wraps) {
      const columns = Math.max(1, Math.floor((rowRect.width + gapX) / (width + gapX)));
      const column = slotIndex % columns;
      const row = Math.floor(slotIndex / columns);

      return {
        x: rowRect.left + column * (width + gapX),
        y: rowRect.top + row * (height + gapY),
      };
    }

    return {
      x: rowRect.left + slotIndex * (width + gapX),
      y: rowRect.top + Math.max(0, (rowRect.height - height) / 2),
    };
  }, []);

  const hasActiveInProgress = Boolean(auth.user && inProgressSessionId && !gameOver);

  const handleReset = useCallback(() => {
    if (hasActiveInProgress) return;
    clearPendingCommit();
    setFlyingCards([]);
    setIsDealing(false);
    setPendingDeal(null);
    setLandedIds(new Set());
    setInProgressSessionId(null);
    lastSavedTurnCountRef.current = 0;
    eng.reset();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [clearPendingCommit, eng, hasActiveInProgress]);

  const handleCloseRoute = useCallback(() => {
    clearHashRoute();
    setRoute("");
  }, []);

  const openHistoryPage = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.hash = "history";
    }
    setRoute("history");
  }, []);

  const openLeaderboardPage = useCallback(() => {
    if (typeof window === "undefined") return;

    const targetUrl = `${window.location.pathname}${window.location.search}#leaderboard`;
    const nextWindow = window.open(targetUrl, "_blank", "noopener,noreferrer");

    if (!nextWindow) {
      window.location.hash = "leaderboard";
      setRoute("leaderboard");
    }
  }, []);

  const handleAnimatedDeal = useCallback(() => {
    if (isDealing) return;

    setIsSelectorOpen(false);

    const result = eng.computeFullDeal();
    if (!result) {
      eng.deal();
      return;
    }

    const deckEl = deckRef.current;
    const playerEl = playerHandRef.current;
    const dealerEl = dealerHandRef.current;

    if (!deckEl || !playerEl || !dealerEl) {
      eng.deal();
      return;
    }

    setIsDealing(true);

    const deckRect = deckEl.getBoundingClientRect();
    const from = {
      x: deckRect.left + deckRect.width / 2 - HAND_CARD_WIDTH / 2,
      y: deckRect.top + deckRect.height / 2 - HAND_CARD_HEIGHT / 2,
    };

    const cards = [];

    result.dealerCards.forEach((card, i) => {
      const to = getCardTarget(dealerEl, dealer.length + i);
      if (!to) return;

      cards.push({
        id: `d-${Date.now()}-${i}`,
        card,
        from,
        to,
        delay: i * CARD_DELAY,
        duration: CARD_DURATION,
      });
    });

    if (result.playerCard) {
      const to = getCardTarget(playerEl, player.length);
      if (to) {
        cards.push({
          id: `p-${Date.now()}`,
          card: result.playerCard,
          from,
          to,
          delay: result.dealerCards.length * CARD_DELAY,
          duration: CARD_DURATION,
          highlight: Boolean(result.isGameOver),
        });
      }
    }

    if (result.topUpCards?.length) {
      const dealerCountAfterDeal = dealer.length + result.dealerCards.length;
      const topUpStartDelay = cards.length * CARD_DELAY + 350;

      result.topUpCards.forEach((card, i) => {
        const to = getCardTarget(dealerEl, dealerCountAfterDeal + i);
        if (!to) return;

        cards.push({
          id: `t-${Date.now()}-${i}`,
          card,
          from,
          to,
          delay: topUpStartDelay + i * CARD_DELAY,
          duration: CARD_DURATION,
        });
      });
    }

    if (cards.length === 0) {
      setIsDealing(false);
      eng.deal();
      return;
    }

    setFlyingCards(cards);
    setPendingDeal(result);
    setLandedIds(new Set());

    clearPendingCommit();

    const landingTimeouts = cards.map((fc) =>
      setTimeout(() => {
        setLandedIds((prev) => {
          const next = new Set(prev);
          next.add(cardId(fc.card));
          return next;
        });
      }, fc.delay + fc.duration)
    );
    landingTimeoutsRef.current = landingTimeouts;

    const lastDelay = cards.length > 0 ? cards[cards.length - 1].delay : 0;
    commitTimeoutRef.current = setTimeout(() => {
      eng.commitDeal(result);
      setPendingDeal(null);
      setLandedIds(new Set());
      setFlyingCards([]);
      setIsDealing(false);
      commitTimeoutRef.current = null;
    }, lastDelay + CARD_DURATION + 60);
  }, [clearPendingCommit, dealer.length, eng, getCardTarget, isDealing, player.length]);

  useEffect(() => clearPendingCommit, [clearPendingCommit]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = (event) => {
      const desktop = event?.matches ?? mediaQuery.matches;
      setIsDesktop(desktop);
      setIsSelectorOpen((current) => (desktop ? true : current));
    };

    syncViewport();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    const syncRoute = () => setRoute(getHashRoute());

    syncRoute();
    window.addEventListener("hashchange", syncRoute);

    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (!isDesktop && player.length > 0 && !isDealing) {
      setIsSelectorOpen(false);
    }
  }, [isDesktop, isDealing, player.length]);

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

  useEffect(() => {
    if (!completedGameSummary) {
      syncingKeyRef.current = null;
      setSyncStatus({ state: "idle", message: "" });
      return;
    }

    if (!auth.hasSupabaseConfig) {
      return;
    }

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
        setSyncStatus({
          state: "saved",
          message: "Last hand saved to your history.",
        });
        setAccountRefreshToken((value) => value + 1);
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

  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();

      if (
        showRules ||
        showAccount ||
        route ||
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      const flashButton = (buttonId, action, duration = 200) => {
        setButtonFlash((prev) => ({ ...prev, [buttonId]: true }));
        setTimeout(() => {
          setButtonFlash((prev) => ({ ...prev, [buttonId]: false }));
        }, duration);
        action();
      };

      if (key === "enter") {
        if (selection.size > 0 && player.length < 5 && !isDealing) {
          flashButton("deal", () => handleAnimatedDeal(), 150);
        } else {
          flashButton("deal", () => {}, 300);
        }
        return;
      }

      if (["s", "h", "c", "d"].includes(key)) {
        if (isDealing) return;
        const suit = key.toUpperCase();
        flashButton(`suit-${suit}`, () => eng.selectSuit(suit));
        return;
      }

      if (["2", "3", "4", "5", "6", "7", "8", "9", "t", "j", "q", "k", "a"].includes(key)) {
        if (isDealing) return;
        const rank = key.toUpperCase();
        flashButton(`rank-${rank}`, () => eng.selectRank(rank));
        return;
      }

      if (key === "0") {
        if (isDealing) return;
        flashButton("selectAll", () => eng.selectAll());
        return;
      }
      if (key === "x") {
        if (isDealing) return;
        flashButton("clear", () => eng.clearSelection());
        return;
      }
      if (key === "n") {
        if (hasActiveInProgress) return;
        flashButton("newGame", () => handleReset());
        return;
      }
      if (key === "?") {
        flashButton("help", () => setShowRules(true));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selection.size, player.length, showRules, showAccount, route, eng, isDealing, hasActiveInProgress, handleAnimatedDeal, handleReset]);

  if (route === "leaderboard") {
    return <LeaderboardPage onBack={handleCloseRoute} standalone />;
  }

  if (route === "history") {
    if (auth.loading) {
      return (
        <FullScreenNotice
          title="Hand History"
          message="Loading account state..."
          onBack={handleCloseRoute}
        />
      );
    }

    if (!auth.user) {
      return (
        <FullScreenNotice
          title="Hand History"
          message="Sign in to view your saved hand history."
          onBack={handleCloseRoute}
        />
      );
    }

    return <HistoryPage onBack={handleCloseRoute} userId={auth.user.id} />;
  }

  const pendingPlayerCards = pendingDeal?.playerCard && landedIds.has(cardId(pendingDeal.playerCard))
    ? [pendingDeal.playerCard]
    : [];
  const pendingDealerCards = pendingDeal
    ? [...pendingDeal.dealerCards, ...(pendingDeal.topUpCards || [])].filter((c) => landedIds.has(cardId(c)))
    : [];
  const displayPlayer = pendingDeal ? [...player, ...pendingPlayerCards] : player;
  const displayDealer = pendingDeal ? [...dealer, ...pendingDealerCards] : dealer;
  const displayPlayerEval = pendingDeal
    ? (displayPlayer.length ? evaluateBestHand(displayPlayer) : null)
    : playerEval;
  const displayDealerEval = pendingDeal
    ? (displayDealer.length ? evaluateBestHand(displayDealer) : null)
    : dealerEval;

  const deckCount = remainingIds.size;
  const visibleDeckCount = Math.max(0, deckCount - flyingCards.length);
  const selectorSummary = `${selection.size} selected`;
  const selectorDeckLabel = `${visibleDeckCount} live`;
  const selectionDisabled = isDealing || gameOver;

  return (
    <div className="min-h-screen flex flex-col max-w-5xl lg:max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-2 md:items-center md:px-5 md:pt-5 md:pb-3">
        <h1 className="shrink-0 text-base tracking-tight md:text-lg" style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
          <a href="/" className="hover:opacity-80 transition-opacity" title="Start a new game">
            renjie poker
          </a>
        </h1>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <ThemeToggle />
          <button
            className={`btn-theme topbar-icon-btn ${buttonFlash.help ? "bg-[var(--color-accent)] text-[var(--color-background)]" : ""}`}
            onClick={() => setShowRules(true)}
            title="Help"
            type="button"
          >
            <span className="text-[15px] leading-none">?</span>
          </button>
          <a
            className="btn-theme topbar-icon-btn"
            href="#leaderboard"
            rel="noopener noreferrer"
            target="_blank"
            title="View public leaderboard"
          >
            <TrophyIcon className="h-4 w-4" />
          </a>
          <button
            className={auth.user ? "btn-theme topbar-icon-btn" : "btn-theme"}
            onClick={() => setShowAccount(true)}
            title={auth.user ? "Profile" : "Log in"}
            type="button"
          >
            {auth.user ? <UserIcon className="h-4 w-4" /> : "log in"}
          </button>
          <button
            className={`btn-theme ${hasActiveInProgress ? "opacity-40 cursor-not-allowed" : gameOver ? "cta-glow border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-background)]" : buttonFlash.newGame ? "bg-[var(--color-accent)] text-[var(--color-background)]" : ""}`}
            disabled={hasActiveInProgress}
            onClick={handleReset}
            title={hasActiveInProgress ? "Finish your current hand first" : undefined}
            type="button"
          >
            new game
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 md:px-5">
        {(!gameOver || isDealing) && (
          <div className="mb-3 text-xs text-[var(--color-text-muted)] md:mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
            {restoringGame ? "Resuming your previous hand..." : message}
          </div>
        )}
        {gameOver && !isDealing && (
          <WinnerBanner
            winner={winner}
            playerEval={playerEval}
            dealerEval={dealerEval}
          />
        )}

        <section className="mb-4 flex flex-col items-start gap-3 md:mb-6 md:flex-row md:gap-6">
          <div className="flex-1 min-w-0">
            <HandHeader
              countLabel={`${displayPlayer.length}/5 cards`}
              handName={displayPlayerEval?.name}
              label="Player"
              resultTag={gameOver ? (winner === "player" ? "winner" : "loser") : null}
            />
            <div ref={playerHandRef}>
              <HandRow cards={displayPlayer} highlightBest={displayPlayer} />
            </div>
            {visibleDeckCount > 0 && (
              <div className="mt-3 flex items-start">
                <div
                  ref={deckRef}
                  className="deck-shell flex items-center gap-3 py-2 px-3"
                >
                  <div className="relative shrink-0" style={{ width: 52, height: 68 }}>
                    {visibleDeckCount > 2 && (
                      <div className="card-back absolute rounded" style={{ top: 0, left: 0 }} />
                    )}
                    {visibleDeckCount > 1 && (
                      <div className="card-back absolute rounded" style={{ top: 2, left: 2 }} />
                    )}
                    <div className="card-back absolute rounded" style={{ top: 4, left: 4 }} />
                  </div>
                  <div className="leading-tight">
                    <div
                      className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      deck
                    </div>
                    <div
                      className="text-xs tabular-nums text-[var(--color-text)]"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {visibleDeckCount} live
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <HandHeader
              countLabel={`${displayDealer.length} cards`}
              handName={displayDealerEval?.name}
              label="Dealer"
              resultTag={gameOver ? (winner === "dealer" ? "winner" : "loser") : null}
            />
            <div ref={dealerHandRef}>
              <HandRow cards={displayDealer} highlightBest={displayDealerEval?.bestFive || null} wrap />
            </div>
          </div>
        </section>

        {flyingCards.length > 0 && (
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
            {flyingCards.map((fc) => (
              <FlyingCard
                key={fc.id}
                card={fc.card}
                delay={fc.delay}
                duration={fc.duration}
                from={fc.from}
                highlight={fc.highlight}
                to={fc.to}
              />
            ))}
          </div>
        )}

        <section className="sticky bottom-0 z-20 mt-auto border-t border-[var(--color-border)] bg-[var(--color-background)]/92 backdrop-blur-md">
          <div className="py-3 md:py-4">
            <button
              aria-controls="selection-panel"
              aria-expanded={isSelectorOpen}
              className="flex w-full items-center justify-between gap-3 md:hidden"
              onClick={() => setIsSelectorOpen((current) => !current)}
              type="button"
            >
              <div className="min-w-0 text-left">
                <div
                  className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Select from deck
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-text)]">
                    {selectorSummary}
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[var(--color-text-muted)]">
                    {selectorDeckLabel}
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[var(--color-text-muted)]">
                    {displayPlayer.length}/5 cards
                  </span>
                </div>
              </div>
              <span
                aria-hidden="true"
                className="btn-theme min-w-[74px] justify-center"
              >
                {isSelectorOpen ? "close" : "open"}
              </span>
            </button>

            <div className="mt-3 md:hidden">
              <SelectionButtons
                buttonFlash={buttonFlash}
                canDeal={player.length < 5 && !selectionDisabled}
                disabled={selectionDisabled}
                hasSelection={selection.size > 0}
                onClearSelection={eng.clearSelection}
                onDeal={handleAnimatedDeal}
                onSelectAll={eng.selectAll}
                onSelectRank={eng.selectRank}
                onSelectSuit={eng.selectSuit}
                remaining={eng.remaining}
                selection={selection}
              />
            </div>

            <div
              className={[
                isDesktop || isSelectorOpen ? "block" : "hidden",
                !isDesktop
                  ? "mt-3 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)]/96 px-3 py-3 shadow-[0_12px_28px_color-mix(in_srgb,var(--color-text)_10%,transparent)]"
                  : "",
              ].join(" ")}
              id="selection-panel"
            >
              <div className="hidden text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3 md:block" style={{ fontFamily: "'DM Mono', monospace" }}>
                Select from deck
              </div>
              {gameOver && (
                <div
                  className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] text-[var(--color-text)]"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Hand complete. Start a new game to select from the deck again.
                </div>
              )}
              <div className="hidden md:block">
                <SelectionButtons
                  buttonFlash={buttonFlash}
                  canDeal={player.length < 5 && !selectionDisabled}
                  disabled={selectionDisabled}
                  hasSelection={selection.size > 0}
                  onClearSelection={eng.clearSelection}
                  onDeal={handleAnimatedDeal}
                  onSelectAll={eng.selectAll}
                  onSelectRank={eng.selectRank}
                  onSelectSuit={eng.selectSuit}
                  remaining={eng.remaining}
                  selection={selection}
                />
                <div className="h-3" />
              </div>
              <div className={`max-h-[50vh] overflow-y-auto pr-1 transition-opacity md:max-h-[45vh] ${selectionDisabled ? "opacity-60" : ""}`}>
                <SelectionGrid
                  disabled={selectionDisabled}
                  onToggle={eng.toggleSelect}
                  remainingIds={remainingIds}
                  selection={selection}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter className="pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-5" />

      <Modal open={showRules} onClose={() => setShowRules(false)} title="How to Play">
        <RulesContent />
      </Modal>

      <AccountModal
        auth={auth}
        onClose={() => setShowAccount(false)}
        onOpenHistory={openHistoryPage}
        onOpenLeaderboard={openLeaderboardPage}
        open={showAccount}
        refreshToken={accountRefreshToken}
        syncStatus={syncStatus}
      />

      <LeaderboardOnboardingModal
        open={auth.isNewUser}
        auth={auth}
        onClose={auth.dismissNewUser}
      />
    </div>
  );
}
