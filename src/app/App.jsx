import useRenjiePokerEngine from "../engine/useRenjiePokerEngine";
import HandRow from "../components/HandRow";
import SelectionGrid from "../components/SelectionGrid";
import SelectionButtons from "../components/SelectionButtons";
import Controls from "../components/Controls";
import ThemeToggle from "../components/ThemeToggle";
import Modal from "../components/Modal";
import RulesContent from "../components/RulesContent";
import MenuButton from "../components/MenuButton";

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
      
      // Don't process shortcuts when modal is open or when typing in input fields
      if (showRules || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Helper function to flash a button
      const flashButton = (buttonId, action, duration = 200) => {
        setButtonFlash(prev => ({ ...prev, [buttonId]: true }));
        setTimeout(() => {
          setButtonFlash(prev => ({ ...prev, [buttonId]: false }));
        }, duration);
        action();
      };

      // Deal shortcut (Enter/Return key)
      if (key === 'enter') {
        if (selection.size > 0 && player.length < 5) {
          flashButton('deal', () => eng.deal(), 150);
        } else {
          flashButton('deal', () => {}, 300);
        }
        return;
      }

      // Suit shortcuts (S, H, C, D)
      if (['s', 'h', 'c', 'd'].includes(key)) {
        const suit = key.toUpperCase();
        flashButton(`suit-${suit}`, () => eng.selectSuit(suit));
        return;
      }

      // Rank shortcuts (2-9, T, J, Q, K, A)
      if (['2', '3', '4', '5', '6', '7', '8', '9', 't', 'j', 'q', 'k', 'a'].includes(key)) {
        const rank = key.toUpperCase();
        flashButton(`rank-${rank}`, () => eng.selectRank(rank));
        return;
      }

      // Action shortcuts
      if (key === '0') {
        flashButton('selectAll', () => eng.selectAll());
        return;
      }

      if (key === 'x') {
        flashButton('clear', () => eng.clearSelection());
        return;
      }

      if (key === 'n') {
        flashButton('newGame', () => eng.reset());
        return;
      }

      if (key === '?') {
        flashButton('help', () => setShowRules(true));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selection.size, player.length, showRules, eng]);

  return (
    // Full-screen flex column
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold">Renjie Poker</h1>
        <div className="flex items-center gap-3">


          <ThemeToggle />
          <Controls
            onNew={eng.reset}
            onDeal={eng.deal}
            canDeal={player.length < 5}
            newGameFlash={buttonFlash.newGame}
          />
          <button 
            className={`btn-theme ${buttonFlash.help ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}`}
            onClick={() => setShowRules(true)}
          >
            How to Play
          </button>

        </div>
      </header>

      {/* Scrollable middle section that holds both top and bottom */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4">
        <div className="mb-3 text-sm opacity-80">{message}</div>

        {/* Player + dealer shrink naturally (no forced height) */}
        <section className="flex flex-wrap gap-6 mb-6">
          <div className="flex-1 min-w-[280px]">
            <div className="text-lg font-semibold mb-2">Player ({player.length})</div>
            <HandRow
              title={playerEval ? `Best: ${playerEval.name}` : "Your hand"}
              cards={player}
              highlightBest={playerEval?.bestFive || null}
            />
          </div>

          <div className="flex-1 min-w-[280px]">
            <div className="text-lg font-semibold mb-2">Dealer ({dealer.length})</div>
            <HandRow
              title={dealerEval ? `Best: ${dealerEval.name}` : "Dealer's cards"}
              cards={dealer}
              highlightBest={dealerEval?.bestFive || null}
            />
          </div>
        </section>

        {/* Selection sticks to bottom, but pushes down if tall */}
        <section className="mt-auto sticky bottom-0 border-t bg-[var(--color-background)]/85 backdrop-blur">
          <div className="p-3">
            <div className="text-sm font-medium mb-2">Select Subset (from remaining deck)</div>
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

            {/* Scrollable grid of remaining cards */}
            <div className="max-h-[50vh] overflow-y-auto">
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

      {/* Modal mount */}
      <Modal open={showRules} onClose={() => setShowRules(false)} title="How to Play">
        <RulesContent />
      </Modal>
    </div>
  );
}
