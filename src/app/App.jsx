import useRenjiePokerEngine from "../engine/useRenjiePokerEngine";
import HandRow from "../components/HandRow";
import SelectionGrid from "../components/SelectionGrid";
import SelectionButtons from "../components/SelectionButtons";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import RulesContent from "../components/RulesContent";

import { useState, useRef, useEffect, useCallback } from "react";

const HAND_CARD_WIDTH = 48;
const HAND_CARD_HEIGHT = 64;
const HAND_CARD_GAP = 4;
const CARD_DELAY = 210;
const CARD_DURATION = 460;

function FlyingCard({ card, from, to, delay, duration }) {
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), delay);
    const t2 = setTimeout(() => setPhase('flying'), delay + 50);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  if (phase === 'hidden') return null;

  const isFlying = phase === 'flying';
  const pos = isFlying ? to : from;
  const isRed = card.suitKey === 'H' || card.suitKey === 'D';

  return (
    <div
      className="card-display-theme text-sm"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 100,
        transition: isFlying
          ? `left ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), top ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${duration}ms ease`
          : 'none',
        transform: isFlying ? 'scale(1)' : 'scale(1.12)',
        boxShadow: isFlying
          ? '0 1px 3px rgba(0,0,0,0.1)'
          : '0 8px 20px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
      }}
    >
      <span className={`font-medium ${isRed ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"}`}>
        {card.rank}
      </span>
      <span className={`ml-0.5 text-xs opacity-70 ${isRed ? "text-[var(--color-suit-red)]" : "text-[var(--color-suit-black)]"}`}>
        {card.suit}
      </span>
    </div>
  );
}

function HandHeader({ label, countLabel, handName }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div
          className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {label}
        </div>
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

export default function App() {
  const eng = useRenjiePokerEngine();
  const {
    player, dealer, message, selection, remainingIds,
    playerEval, dealerEval
  } = eng;

  const [showRules, setShowRules] = useState(false);
  const [buttonFlash, setButtonFlash] = useState({});
  const [flyingCards, setFlyingCards] = useState([]);
  const [isDealing, setIsDealing] = useState(false);
  const deckRef = useRef(null);
  const playerHandRef = useRef(null);
  const dealerHandRef = useRef(null);
  const commitTimeoutRef = useRef(null);

  const clearPendingCommit = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }
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

  const handleReset = useCallback(() => {
    clearPendingCommit();
    setFlyingCards([]);
    setIsDealing(false);
    eng.reset();
  }, [clearPendingCommit, eng]);

  const handleAnimatedDeal = useCallback(() => {
    if (isDealing) return;

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
        });
      }
    }

    if (result.topUpCards && result.topUpCards.length > 0) {
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

    const lastDelay = cards.length > 0 ? cards[cards.length - 1].delay : 0;
    clearPendingCommit();
    commitTimeoutRef.current = setTimeout(() => {
      eng.commitDeal(result);
      setFlyingCards([]);
      setIsDealing(false);
      commitTimeoutRef.current = null;
    }, lastDelay + CARD_DURATION + 60);
  }, [clearPendingCommit, dealer.length, eng, getCardTarget, isDealing, player.length]);

  useEffect(() => clearPendingCommit, [clearPendingCommit]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();

      if (showRules || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const flashButton = (buttonId, action, duration = 200) => {
        setButtonFlash(prev => ({ ...prev, [buttonId]: true }));
        setTimeout(() => {
          setButtonFlash(prev => ({ ...prev, [buttonId]: false }));
        }, duration);
        action();
      };

      if (key === 'enter') {
        if (selection.size > 0 && player.length < 5 && !isDealing) {
          flashButton('deal', () => handleAnimatedDeal(), 150);
        } else {
          flashButton('deal', () => {}, 300);
        }
        return;
      }

      if (['s', 'h', 'c', 'd'].includes(key)) {
        const suit = key.toUpperCase();
        flashButton(`suit-${suit}`, () => eng.selectSuit(suit));
        return;
      }

      if (['2', '3', '4', '5', '6', '7', '8', '9', 't', 'j', 'q', 'k', 'a'].includes(key)) {
        const rank = key.toUpperCase();
        flashButton(`rank-${rank}`, () => eng.selectRank(rank));
        return;
      }

      if (key === '0') { flashButton('selectAll', () => eng.selectAll()); return; }
      if (key === 'x') { flashButton('clear', () => eng.clearSelection()); return; }
      if (key === 'n') { flashButton('newGame', () => handleReset()); return; }
      if (key === '?') { flashButton('help', () => setShowRules(true)); return; }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selection.size, player.length, showRules, eng, isDealing, handleAnimatedDeal, handleReset]);

  const deckCount = remainingIds.size;
  const visibleDeckCount = Math.max(0, deckCount - flyingCards.length);

  return (
    <div className="min-h-screen flex flex-col max-w-5xl lg:max-w-6xl mx-auto">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-lg tracking-tight" style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
          <a href="/" className="hover:opacity-80 transition-opacity" title="Start a new game">
            renjie poker
          </a>
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className={`btn-theme ${buttonFlash.newGame ? 'bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
            onClick={handleReset}
          >
            new game
          </button>
          <button
            className={`btn-theme ${buttonFlash.help ? 'bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
            onClick={() => setShowRules(true)}
          >
            ?
          </button>
        </div>
      </header>

      {/* Status */}
      <main className="flex-1 flex flex-col px-5">
        <div className="text-xs text-[var(--color-text-muted)] mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
          {message}
        </div>

        {/* Hands + Deck */}
        <section className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 items-start">
          {/* Player hand */}
          <div className="flex-1 min-w-0">
            <HandHeader
              label="Player"
              countLabel={`${player.length}/5 cards`}
              handName={playerEval?.name}
            />
            <div ref={playerHandRef}>
              <HandRow cards={player} highlightBest={playerEval?.bestFive || null} />
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

          {/* Dealer hand */}
          <div className="flex-1 min-w-0">
            <HandHeader
              label="Dealer"
              countLabel={`${dealer.length} cards`}
              handName={dealerEval?.name}
            />
            <div ref={dealerHandRef}>
              <HandRow cards={dealer} highlightBest={dealerEval?.bestFive || null} wrap />
            </div>
          </div>
        </section>

        {/* Flying cards overlay */}
        {flyingCards.length > 0 && (
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
            {flyingCards.map(fc => (
              <FlyingCard
                key={fc.id}
                card={fc.card}
                from={fc.from}
                to={fc.to}
                delay={fc.delay}
                duration={fc.duration}
              />
            ))}
          </div>
        )}

        {/* Selection panel */}
        <section className="mt-auto sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur-sm">
          <div className="py-4">
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Select from deck
            </div>
            <SelectionButtons
              onSelectSuit={eng.selectSuit}
              onSelectRank={eng.selectRank}
              onSelectAll={eng.selectAll}
              onClearSelection={eng.clearSelection}
              onDeal={handleAnimatedDeal}
              hasSelection={selection.size > 0}
              canDeal={player.length < 5 && !isDealing}
              disabled={isDealing}
              buttonFlash={buttonFlash}
            />
            <div className="h-3" />
            <div className={`max-h-[45vh] overflow-y-auto transition-opacity ${isDealing ? "opacity-60" : ""}`}>
              <SelectionGrid
                remainingIds={remainingIds}
                selection={selection}
                onToggle={eng.toggleSelect}
                disabled={isDealing}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer credit */}
      <footer
        className="px-5 pt-3 pb-5 text-center text-xs text-[var(--color-text-muted)]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        game by Renjie You · site by Grace Tang
      </footer>

      <Modal open={showRules} onClose={() => setShowRules(false)} title="How to Play">
        <RulesContent />
      </Modal>
    </div>
  );
}
