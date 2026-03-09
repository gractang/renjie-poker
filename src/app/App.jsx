import useRenjiePokerEngine from "../engine/useRenjiePokerEngine";
import HandRow from "../components/HandRow";
import SelectionGrid from "../components/SelectionGrid";
import SelectionButtons from "../components/SelectionButtons";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import RulesContent from "../components/RulesContent";

import { useState, useRef, useEffect, useCallback } from "react";

function FlyingCard({ card, from, to, delay, duration }) {
  const [phase, setPhase] = useState('hidden');

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
  const dealButtonRef = useRef(null);
  const deckRef = useRef(null);
  const playerHandRef = useRef(null);
  const dealerHandRef = useRef(null);

  const handleReset = useCallback(() => {
    setFlyingCards([]);
    setIsDealing(false);
    eng.reset();
  }, [eng]);

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
    const playerRect = playerEl.getBoundingClientRect();
    const dealerRect = dealerEl.getBoundingClientRect();

    const from = {
      x: deckRect.left + deckRect.width / 2 - 24,
      y: deckRect.top + deckRect.height / 2 - 32,
    };

    const CARD_DELAY = 160;
    const CARD_DURATION = 380;

    const cards = [];

    // Dealer cards (burns)
    result.dealerCards.forEach((card, i) => {
      const idx = dealer.length + i;
      cards.push({
        id: `d-${Date.now()}-${i}`,
        card,
        from,
        to: {
          x: dealerRect.left + Math.min(idx * 52, Math.max(0, dealerRect.width - 48)),
          y: dealerRect.top,
        },
        delay: i * CARD_DELAY,
        duration: CARD_DURATION,
      });
    });

    // Player card
    if (result.playerCard) {
      cards.push({
        id: `p-${Date.now()}`,
        card: result.playerCard,
        from,
        to: {
          x: playerRect.left + player.length * 52,
          y: playerRect.top,
        },
        delay: result.dealerCards.length * CARD_DELAY,
        duration: CARD_DURATION,
      });
    }

    // TopUp cards (when game ends, dealer gets filled to 8)
    if (result.topUpCards && result.topUpCards.length > 0) {
      const dealerCountAfterDeal = dealer.length + result.dealerCards.length;
      const topUpStartDelay = cards.length * CARD_DELAY + 350;

      result.topUpCards.forEach((card, i) => {
        const idx = dealerCountAfterDeal + i;
        cards.push({
          id: `t-${Date.now()}-${i}`,
          card,
          from,
          to: {
            x: dealerRect.left + Math.min(idx * 52, Math.max(0, dealerRect.width - 48)),
            y: dealerRect.top,
          },
          delay: topUpStartDelay + i * CARD_DELAY,
          duration: CARD_DURATION,
        });
      });
    }

    setFlyingCards(cards);

    const lastDelay = cards.length > 0 ? cards[cards.length - 1].delay : 0;
    setTimeout(() => {
      eng.commitDeal(result);
      setFlyingCards([]);
      setIsDealing(false);
    }, lastDelay + CARD_DURATION + 60);
  }, [eng, isDealing, player.length, dealer.length]);

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

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-lg tracking-tight" style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
          renjie poker
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
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              Player · {player.length}/5
              {playerEval && <span className="ml-2 normal-case tracking-normal">{playerEval.name}</span>}
            </div>
            <div ref={playerHandRef}>
              <HandRow cards={player} highlightBest={playerEval?.bestFive || null} />
            </div>
          </div>

          {/* Deck */}
          {deckCount > 0 && (
            <div
              ref={deckRef}
              className="flex flex-row md:flex-col items-center justify-center gap-2 py-1 md:pt-6 shrink-0 self-center md:self-start"
            >
              <div className="relative" style={{ width: 52, height: 68 }}>
                {deckCount > 2 && (
                  <div className="card-back absolute rounded" style={{ top: 0, left: 0 }} />
                )}
                {deckCount > 1 && (
                  <div className="card-back absolute rounded" style={{ top: 2, left: 2 }} />
                )}
                <div className="card-back absolute rounded" style={{ top: 4, left: 4 }} />
              </div>
              <span
                className="text-[10px] text-[var(--color-text-muted)] tabular-nums"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {deckCount}
              </span>
            </div>
          )}

          {/* Dealer hand */}
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              Dealer · {dealer.length}
              {dealerEval && <span className="ml-2 normal-case tracking-normal">{dealerEval.name}</span>}
            </div>
            <div ref={dealerHandRef}>
              <HandRow cards={dealer} highlightBest={dealerEval?.bestFive || null} />
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
              buttonFlash={buttonFlash}
              dealButtonRef={dealButtonRef}
            />
            <div className="h-3" />
            <div className="max-h-[45vh] overflow-y-auto">
              <SelectionGrid
                remainingIds={remainingIds}
                selection={selection}
                onToggle={eng.toggleSelect}
                onSelectSuit={eng.selectSuit}
              />
            </div>
          </div>
        </section>
      </main>

      <Modal open={showRules} onClose={() => setShowRules(false)} title="How to Play">
        <RulesContent />
      </Modal>
    </div>
  );
}
