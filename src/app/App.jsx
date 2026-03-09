import useRenjiePokerEngine from "../engine/useRenjiePokerEngine";
import HandRow from "../components/HandRow";
import SelectionGrid from "../components/SelectionGrid";
import SelectionButtons from "../components/SelectionButtons";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import RulesContent from "../components/RulesContent";

import { useState, useRef, useEffect } from "react";

export default function App() {
  const eng = useRenjiePokerEngine();
  const {
    player, dealer, message, selection, remainingIds,
    playerEval, dealerEval
  } = eng;

  const [showRules, setShowRules] = useState(false);
  const [buttonFlash, setButtonFlash] = useState({});
  const dealButtonRef = useRef(null);

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
        if (selection.size > 0 && player.length < 5) {
          flashButton('deal', () => eng.deal(), 150);
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
      if (key === 'n') { flashButton('newGame', () => eng.reset()); return; }
      if (key === '?') { flashButton('help', () => setShowRules(true)); return; }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selection.size, player.length, showRules, eng]);

  return (
    <div className="min-h-screen flex flex-col max-w-5xl lg:max-w-6xl mx-auto">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-lg tracking-tight" style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
          renjie poker
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className={`btn-theme ${buttonFlash.newGame ? 'bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
            onClick={eng.reset}
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

        {/* Hands */}
        <section className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              Player · {player.length}/5
              {playerEval && <span className="ml-2 normal-case tracking-normal">{playerEval.name}</span>}
            </div>
            <HandRow cards={player} highlightBest={playerEval?.bestFive || null} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              Dealer · {dealer.length}
              {dealerEval && <span className="ml-2 normal-case tracking-normal">{dealerEval.name}</span>}
            </div>
            <HandRow cards={dealer} highlightBest={dealerEval?.bestFive || null} />
          </div>
        </section>

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
              onDeal={eng.deal}
              hasSelection={selection.size > 0}
              canDeal={player.length < 5}
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
